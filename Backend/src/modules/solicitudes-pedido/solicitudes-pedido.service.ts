import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { EstadoSolicitudPedido, SolicitudPedido } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { assertFound } from '../../common/utils/assert-found.util';
import { SucursalesService } from '../sucursales/sucursales.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AprobarSolicitudDto } from './dto/aprobar-solicitud.dto';
import { CreateSolicitudPublicaDto } from './dto/create-solicitud-publica.dto';
import { ListSolicitudesQueryDto } from './dto/list-solicitudes-query.dto';
import { RechazarSolicitudDto } from './dto/rechazar-solicitud.dto';
import { SolicitudPedidoResponseDto } from './dto/solicitud-pedido-response.dto';
import { TiendaPublicaDto } from './dto/tienda-publica.dto';
import { SOLICITUDES_PEDIDO_REPOSITORY } from './interfaces/solicitudes-pedido-repository.interface';
import type { ISolicitudesPedidoRepository } from './interfaces/solicitudes-pedido-repository.interface';
import { SolicitudesPedidoMapper } from './solicitudes-pedido.mapper';

@Injectable()
export class SolicitudesPedidoService {
  constructor(
    @Inject(SOLICITUDES_PEDIDO_REPOSITORY)
    private readonly solicitudesPedidoRepository: ISolicitudesPedidoRepository,
    private readonly sucursalesService: SucursalesService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async crearPublico(
    dto: CreateSolicitudPublicaDto,
  ): Promise<SolicitudPedidoResponseDto> {
    // Lanza NotFoundException si la sucursal no existe o esta eliminada
    // logicamente — mismo chequeo que PedidosService.crear hace sobre
    // sucursalId, aqui necesario porque el origen es publico/no autenticado.
    await this.sucursalesService.buscarPorId(BigInt(dto.sucursalId));

    const solicitud = await this.solicitudesPedidoRepository.crear({
      sucursalId: BigInt(dto.sucursalId),
      nombreCompleto: dto.nombreCompleto,
      telefono: dto.telefono,
      direccionEntrega: dto.direccionEntrega,
      descripcionProducto: dto.descripcionProducto,
      valorProducto: dto.valorProducto,
      costoEnvio: dto.costoEnvio,
      observaciones: dto.observaciones,
    });
    return SolicitudesPedidoMapper.toResponseDto(solicitud);
  }

  async listarCatalogoPublico(): Promise<TiendaPublicaDto[]> {
    const tiendas =
      await this.solicitudesPedidoRepository.listarCatalogoPublico();
    return SolicitudesPedidoMapper.toTiendaPublicaDtoList(tiendas);
  }

  async buscarPorId(id: bigint): Promise<SolicitudPedidoResponseDto> {
    const solicitud = await this.obtenerSolicitudOFallar(id);
    return SolicitudesPedidoMapper.toResponseDto(solicitud);
  }

  async listar(
    query: ListSolicitudesQueryDto,
  ): Promise<PaginatedResponseDto<SolicitudPedidoResponseDto>> {
    const { data, total } = await this.solicitudesPedidoRepository.buscarMuchos(
      {
        skip: query.skip,
        take: query.limit,
        estado: query.estado,
        tiendaId: query.tiendaId ? BigInt(query.tiendaId) : undefined,
        sucursalId: query.sucursalId ? BigInt(query.sucursalId) : undefined,
        fechaDesde: query.fechaDesde,
        fechaHasta: query.fechaHasta,
      },
    );

    return new PaginatedResponseDto(
      SolicitudesPedidoMapper.toResponseDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async aprobar(
    id: bigint,
    dto: AprobarSolicitudDto,
  ): Promise<SolicitudPedidoResponseDto> {
    const solicitud = await this.obtenerSolicitudOFallar(id);
    this.verificarPendiente(solicitud, 'aprobar');

    // creadoPorId del Pedido resultante es NOT NULL: el usuario que aprueba
    // debe existir (mismo criterio que FlujoPedidoService.cancelarPedido).
    await this.usuariosService.buscarPorId(BigInt(dto.usuarioId));
    // La sucursal pudo eliminarse logicamente entre la creacion de la
    // solicitud y su aprobacion — se revalida aqui por la misma razon que
    // PedidosService.crear la valida al momento real de crear el Pedido.
    await this.sucursalesService.buscarPorId(solicitud.sucursalId);

    const { solicitud: solicitudAprobada } =
      await this.solicitudesPedidoRepository.aprobar({
        solicitudId: id,
        usuarioId: BigInt(dto.usuarioId),
      });
    return SolicitudesPedidoMapper.toResponseDto(solicitudAprobada);
  }

  async rechazar(
    id: bigint,
    dto: RechazarSolicitudDto,
  ): Promise<SolicitudPedidoResponseDto> {
    const solicitud = await this.obtenerSolicitudOFallar(id);
    this.verificarPendiente(solicitud, 'rechazar');

    const solicitudRechazada = await this.solicitudesPedidoRepository.rechazar({
      solicitudId: id,
      motivoRechazo: dto.motivoRechazo,
    });
    return SolicitudesPedidoMapper.toResponseDto(solicitudRechazada);
  }

  private async obtenerSolicitudOFallar(id: bigint): Promise<SolicitudPedido> {
    const solicitud = await this.solicitudesPedidoRepository.buscarPorId(id);
    return assertFound(solicitud, 'Solicitud de pedido no encontrada');
  }

  private verificarPendiente(
    solicitud: SolicitudPedido,
    accion: 'aprobar' | 'rechazar',
  ): void {
    if (solicitud.estado !== EstadoSolicitudPedido.pendiente) {
      throw new ConflictException(
        `La solicitud debe estar en estado 'pendiente' para ${accion}la (estado actual: '${solicitud.estado}')`,
      );
    }
  }
}
