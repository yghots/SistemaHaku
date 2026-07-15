import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Pedido } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { assertFound } from '../../common/utils/assert-found.util';
import {
  calcularEstadoPagoPedido,
  ResumenPagoPedidoCalculado,
} from '../../common/utils/estado-pago-pedido.util';
import { isForeignKeyViolation } from '../../common/utils/prisma-error.util';
import { ClientesService } from '../clientes/clientes.service';
import { SucursalesService } from '../sucursales/sucursales.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { ListPedidosQueryDto } from './dto/list-pedidos-query.dto';
import { PedidoResponseDto } from './dto/pedido-response.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PEDIDOS_REPOSITORY } from './interfaces/pedidos-repository.interface';
import type { IPedidosRepository } from './interfaces/pedidos-repository.interface';
import { PedidosMapper } from './pedidos.mapper';

@Injectable()
export class PedidosService {
  constructor(
    @Inject(PEDIDOS_REPOSITORY)
    private readonly pedidosRepository: IPedidosRepository,
    private readonly sucursalesService: SucursalesService,
    private readonly clientesService: ClientesService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async crear(dto: CreatePedidoDto): Promise<PedidoResponseDto> {
    // Cada buscarPorId ya lanza NotFoundException si el recurso no existe
    // o esta eliminado logicamente (sucursal/cliente/usuario creador).
    await this.sucursalesService.buscarPorId(BigInt(dto.sucursalId));
    await this.clientesService.buscarPorId(BigInt(dto.clienteId));
    await this.usuariosService.buscarPorId(BigInt(dto.creadoPorId));

    const pedido = await this.pedidosRepository.crear({
      sucursalId: BigInt(dto.sucursalId),
      clienteId: BigInt(dto.clienteId),
      creadoPorId: BigInt(dto.creadoPorId),
      direccionEntrega: dto.direccionEntrega,
      telefonoContacto: dto.telefonoContacto,
      descripcionProducto: dto.descripcionProducto,
      valorProducto: dto.valorProducto,
      costoEnvio: dto.costoEnvio,
      observaciones: dto.observaciones,
    });
    return PedidosMapper.toResponseDto(
      pedido,
      await this.resumenPagoDe(pedido),
    );
  }

  async buscarPorId(id: bigint): Promise<PedidoResponseDto> {
    const pedido = await this.obtenerPedidoOFallar(id);
    return PedidosMapper.toResponseDto(
      pedido,
      await this.resumenPagoDe(pedido),
    );
  }

  async listar(
    query: ListPedidosQueryDto,
  ): Promise<PaginatedResponseDto<PedidoResponseDto>> {
    const { data, total } = await this.pedidosRepository.buscarMuchos({
      skip: query.skip,
      take: query.limit,
      codigoPedido: query.codigoPedido,
      clienteId: query.clienteId ? BigInt(query.clienteId) : undefined,
      sucursalId: query.sucursalId ? BigInt(query.sucursalId) : undefined,
      estado: query.estado,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
    });

    // Una sola consulta agregada para toda la pagina (Fase 21) — nunca N+1
    // sin importar cuantos pedidos tenga la pagina.
    const resumenPorPedido = await this.resumenPagoDeMuchos(data);

    return new PaginatedResponseDto(
      PedidosMapper.toResponseDtoList(data, resumenPorPedido),
      total,
      query.page,
      query.limit,
    );
  }

  async actualizar(
    id: bigint,
    dto: UpdatePedidoDto,
  ): Promise<PedidoResponseDto> {
    await this.obtenerPedidoOFallar(id);

    const pedidoActualizado = await this.pedidosRepository.actualizar(id, {
      ...(dto.direccionEntrega
        ? { direccionEntrega: dto.direccionEntrega }
        : {}),
      ...(dto.telefonoContacto !== undefined
        ? { telefonoContacto: dto.telefonoContacto }
        : {}),
      ...(dto.descripcionProducto !== undefined
        ? { descripcionProducto: dto.descripcionProducto }
        : {}),
      ...(dto.valorProducto !== undefined
        ? { valorProducto: dto.valorProducto }
        : {}),
      ...(dto.costoEnvio !== undefined ? { costoEnvio: dto.costoEnvio } : {}),
      ...(dto.observaciones !== undefined
        ? { observaciones: dto.observaciones }
        : {}),
    });
    return PedidosMapper.toResponseDto(
      pedidoActualizado,
      await this.resumenPagoDe(pedidoActualizado),
    );
  }

  async eliminar(id: bigint): Promise<PedidoResponseDto> {
    await this.obtenerPedidoOFallar(id);

    try {
      const pedido = await this.pedidosRepository.eliminar(id);
      // Un pedido con pagos nunca llega aqui (el FK de Pago.pedidoId es
      // Restrict): si `eliminar` tuvo exito, su resumen es siempre "sin_pago".
      return PedidosMapper.toResponseDto(
        pedido,
        await this.resumenPagoDe(pedido),
      );
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException(
          'No se puede eliminar el pedido: tiene registros asociados (historial, fotos, incidentes o pagos)',
        );
      }
      throw error;
    }
  }

  private async obtenerPedidoOFallar(id: bigint): Promise<Pedido> {
    const pedido = await this.pedidosRepository.buscarPorId(id);
    return assertFound(pedido, 'Pedido no encontrado');
  }

  /**
   * Estado de pago + saldo pendiente de un unico pedido (Fase 21) —
   * reutiliza la misma consulta agregada que `resumenPagoDeMuchos` con un
   * arreglo de un solo id, para no duplicar la logica de calculo.
   */
  private async resumenPagoDe(
    pedido: Pedido,
  ): Promise<ResumenPagoPedidoCalculado> {
    const resumen = await this.resumenPagoDeMuchos([pedido]);
    return resumen.get(pedido.id.toString())!;
  }

  private async resumenPagoDeMuchos(
    pedidos: Pedido[],
  ): Promise<Map<string, ResumenPagoPedidoCalculado>> {
    if (pedidos.length === 0) return new Map();

    const montosPorPedido =
      await this.pedidosRepository.sumarMontoPagadoPorPedidos(
        pedidos.map((pedido) => pedido.id),
      );

    return new Map(
      pedidos.map((pedido) => {
        const totalPedido =
          (Number(pedido.valorProducto) || 0) +
          (Number(pedido.costoEnvio) || 0);
        const totalPagado = montosPorPedido.get(pedido.id.toString()) ?? 0;
        return [
          pedido.id.toString(),
          calcularEstadoPagoPedido(totalPedido, totalPagado),
        ];
      }),
    );
  }
}
