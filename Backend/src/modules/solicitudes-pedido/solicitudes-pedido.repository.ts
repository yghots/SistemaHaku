import { randomBytes } from 'node:crypto';
import { ConflictException, Injectable } from '@nestjs/common';
import { EstadoSolicitudPedido, Prisma, SolicitudPedido } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PedidoCodigoGenerator } from '../pedidos/pedido-codigo.generator';
import {
  AprobarSolicitudData,
  AprobarSolicitudResultado,
  BuscarSolicitudesParams,
  CrearSolicitudData,
  ISolicitudesPedidoRepository,
  RechazarSolicitudData,
  TiendaConSucursalesPublico,
} from './interfaces/solicitudes-pedido-repository.interface';

@Injectable()
export class SolicitudesPedidoRepository implements ISolicitudesPedidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: CrearSolicitudData): Promise<SolicitudPedido> {
    return this.prisma.solicitudPedido.create({ data });
  }

  buscarPorId(id: bigint): Promise<SolicitudPedido | null> {
    return this.prisma.solicitudPedido.findUnique({ where: { id } });
  }

  async buscarMuchos(
    params: BuscarSolicitudesParams,
  ): Promise<{ data: SolicitudPedido[]; total: number }> {
    const where: Prisma.SolicitudPedidoWhereInput = {
      ...(params.estado ? { estado: params.estado } : {}),
      ...(params.sucursalId ? { sucursalId: params.sucursalId } : {}),
      ...(params.tiendaId ? { sucursal: { tiendaId: params.tiendaId } } : {}),
      ...(params.fechaDesde || params.fechaHasta
        ? {
            creadoEn: {
              ...(params.fechaDesde ? { gte: params.fechaDesde } : {}),
              ...(params.fechaHasta ? { lte: params.fechaHasta } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.solicitudPedido.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { id: 'asc' },
      }),
      this.prisma.solicitudPedido.count({ where }),
    ]);

    return { data, total };
  }

  // Mismo nucleo que `FlujoPedidoRepository.actualizarPedidoCondicional`
  // (Fase 15): la transicion pendiente -> aprobada usa `updateMany` con la
  // precondicion de estado en el propio WHERE, para que dos aprobaciones
  // concurrentes de la misma solicitud nunca puedan "pisarse" (la segunda
  // encuentra count 0 y revierte toda la transaccion sin haber creado
  // Cliente/Pedido). El Cliente se busca/crea/actualiza por telefono, y el
  // Pedido se crea con el mismo truco de codigo temporal que
  // `PedidosRepository.crear` (el id autoincremental no se conoce antes del
  // insert).
  async aprobar(
    data: AprobarSolicitudData,
  ): Promise<AprobarSolicitudResultado> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.solicitudPedido.updateMany({
        where: {
          id: data.solicitudId,
          estado: EstadoSolicitudPedido.pendiente,
        },
        data: {
          estado: EstadoSolicitudPedido.aprobada,
          revisadoEn: new Date(),
        },
      });

      if (count === 0) {
        throw new ConflictException(
          'No se pudo aprobar la solicitud: su estado cambio antes de completar la operacion',
        );
      }

      const solicitud = await tx.solicitudPedido.findUniqueOrThrow({
        where: { id: data.solicitudId },
      });

      let cliente = await tx.cliente.findFirst({
        where: { telefono: solicitud.telefono, deletedAt: null },
      });

      if (!cliente) {
        cliente = await tx.cliente.create({
          data: {
            nombreCompleto: solicitud.nombreCompleto,
            telefono: solicitud.telefono,
            direccion: solicitud.direccionEntrega,
          },
        });
      } else {
        cliente = await tx.cliente.update({
          where: { id: cliente.id },
          data: {
            nombreCompleto: solicitud.nombreCompleto,
            telefono: solicitud.telefono,
            direccion: solicitud.direccionEntrega,
          },
        });
      }

      const codigoPedidoTemporal = `tmp_${randomBytes(10).toString('hex')}`;
      const pedidoCreado = await tx.pedido.create({
        data: {
          sucursalId: solicitud.sucursalId,
          clienteId: cliente.id,
          creadoPorId: data.usuarioId,
          direccionEntrega: solicitud.direccionEntrega,
          telefonoContacto: solicitud.telefono,
          descripcionProducto: solicitud.descripcionProducto,
          valorProducto: solicitud.valorProducto ?? undefined,
          costoEnvio: solicitud.costoEnvio ?? undefined,
          observaciones: solicitud.observaciones,
          codigoPedido: codigoPedidoTemporal,
        },
      });
      const pedido = await tx.pedido.update({
        where: { id: pedidoCreado.id },
        data: {
          codigoPedido: PedidoCodigoGenerator.generar(
            pedidoCreado.id,
            pedidoCreado.creadoEn,
          ),
        },
      });

      const solicitudFinal = await tx.solicitudPedido.update({
        where: { id: data.solicitudId },
        data: { clienteId: cliente.id, pedidoId: pedido.id },
      });

      return { solicitud: solicitudFinal, pedido };
    });
  }

  async rechazar(data: RechazarSolicitudData): Promise<SolicitudPedido> {
    const { count } = await this.prisma.solicitudPedido.updateMany({
      where: { id: data.solicitudId, estado: EstadoSolicitudPedido.pendiente },
      data: {
        estado: EstadoSolicitudPedido.rechazada,
        motivoRechazo: data.motivoRechazo,
        revisadoEn: new Date(),
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'No se pudo rechazar la solicitud: su estado cambio antes de completar la operacion',
      );
    }

    return this.prisma.solicitudPedido.findUniqueOrThrow({
      where: { id: data.solicitudId },
    });
  }

  async listarCatalogoPublico(): Promise<TiendaConSucursalesPublico[]> {
    return this.prisma.tienda.findMany({
      where: { activo: true, deletedAt: null },
      select: {
        id: true,
        nombre: true,
        sucursales: {
          where: { deletedAt: null },
          select: { id: true, nombre: true },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });
  }
}
