import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { MetodoPago } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ESTADOS_CANCELABLES } from '../flujo-pedido/interfaces/flujo-pedido-repository.interface';
import { PedidosService } from '../pedidos/pedidos.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CrearPagoDto } from './dto/crear-pago.dto';
import { PagoResponseDto } from './dto/pago-response.dto';
import { ResumenPagoPedidoDto } from './dto/resumen-pago-pedido.dto';
import { PAGOS_REPOSITORY } from './interfaces/pagos-repository.interface';
import type { IPagosRepository } from './interfaces/pagos-repository.interface';
import { calcularResumenPago, calcularVuelto } from './pagos-calculo.util';
import { PagosMapper } from './pagos.mapper';

/**
 * Modulo de Pagos (Fase 20): registra pagos de un pedido (parciales y/o
 * mixtos, cualquier combinacion de metodos). Cada pago es un registro
 * historico inmutable — este servicio nunca actualiza ni elimina un pago
 * ya creado. Los totales/saldo/estado nunca se almacenan: se calculan en
 * cada solicitud (`pagos-calculo.util.ts`, unica fuente de esa aritmetica).
 */
@Injectable()
export class PagosService {
  constructor(
    @Inject(PAGOS_REPOSITORY)
    private readonly pagosRepository: IPagosRepository,
    private readonly pedidosService: PedidosService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async registrar(
    pedidoId: bigint,
    dto: CrearPagoDto,
  ): Promise<PagoResponseDto> {
    // Cada buscarPorId ya lanza NotFoundException si el recurso no existe
    // (el pedido no tiene borrado logico: "no encontrado" cubre tanto un
    // id inexistente como uno ya eliminado fisicamente).
    const pedido = await this.pedidosService.buscarPorId(pedidoId);
    await this.usuariosService.buscarPorId(BigInt(dto.creadoPorId));

    // Fase 32 (correccion N1 de la auditoria de certificacion): un pedido en
    // un estado terminal ya no admite pagos nuevos. Reutiliza la misma
    // definicion de "estados activos" que ya usa flujo-pedido
    // (ESTADOS_CANCELABLES) en vez de mantener una segunda lista — un
    // pedido fuera de esos 4 estados (entregado, cancelado, rechazado,
    // devuelto, reprogramado, cliente_ausente) esta cerrado.
    if (!ESTADOS_CANCELABLES.includes(pedido.estado)) {
      throw new ConflictException(
        `No se puede registrar un pago: el pedido esta en estado '${pedido.estado}'`,
      );
    }

    const { montoRecibido, vuelto } = this.calcularCamposEfectivo(dto);

    const pago = await this.pagosRepository.crear({
      pedidoId,
      metodoPago: dto.metodoPago,
      monto: dto.monto,
      montoRecibido,
      vuelto,
      observacion: dto.observacion,
      creadoPorId: BigInt(dto.creadoPorId),
    });

    return PagosMapper.toResponseDto(pago);
  }

  async listarPorPedido(
    pedidoId: bigint,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PagoResponseDto>> {
    await this.pedidosService.buscarPorId(pedidoId);

    const { data, total } = await this.pagosRepository.buscarPorPedido({
      pedidoId,
      skip: query.skip,
      take: query.limit,
    });

    return new PaginatedResponseDto(
      PagosMapper.toResponseDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async obtenerResumen(pedidoId: bigint): Promise<ResumenPagoPedidoDto> {
    const pedido = await this.pedidosService.buscarPorId(pedidoId);
    const totalPedido =
      (Number(pedido.valorProducto) || 0) + (Number(pedido.costoEnvio) || 0);
    const totalPagado =
      await this.pagosRepository.sumarMontoPorPedido(pedidoId);

    const resumen = calcularResumenPago(totalPedido, totalPagado);

    return new ResumenPagoPedidoDto({
      pedidoId: pedidoId.toString(),
      totalPedido: resumen.totalPedido.toFixed(2),
      totalPagado: resumen.totalPagado.toFixed(2),
      saldoPendiente: resumen.saldoPendiente.toFixed(2),
      estadoPago: resumen.estadoPago,
    });
  }

  /**
   * Reglas de "Efectivo" (unicas de este metodo, seccion "EFECTIVO" de la
   * fase): exige `montoRecibido`, rechaza si es menor al monto, calcula el
   * vuelto. Para el resto de metodos, `montoRecibido` no se solicita ni se
   * acepta — evita que un pago no-efectivo termine con un vuelto sin
   * sentido.
   */
  private calcularCamposEfectivo(dto: CrearPagoDto): {
    montoRecibido?: number;
    vuelto?: number;
  } {
    if (dto.metodoPago !== MetodoPago.efectivo) {
      if (dto.montoRecibido !== undefined) {
        throw new BadRequestException(
          'El monto recibido solo aplica para pagos en efectivo',
        );
      }
      return {};
    }

    if (dto.montoRecibido === undefined) {
      throw new BadRequestException(
        'El monto recibido es obligatorio para pagos en efectivo',
      );
    }
    if (dto.montoRecibido < dto.monto) {
      throw new BadRequestException(
        'El monto recibido no puede ser menor al monto del pago',
      );
    }

    return {
      montoRecibido: dto.montoRecibido,
      vuelto: calcularVuelto(dto.monto, dto.montoRecibido),
    };
  }
}
