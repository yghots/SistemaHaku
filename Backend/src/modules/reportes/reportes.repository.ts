import { Injectable } from '@nestjs/common';
import { EstadoPedido, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IReportesRepository,
  ReporteEntregasParams,
  ReporteMotorizadoRow,
  ReporteMotorizadosParams,
  ReportePedidoRow,
  ReportePedidosParams,
} from './interfaces/reportes-repository.interface';

const REPORTE_PEDIDO_SELECT = {
  id: true,
  codigoPedido: true,
  estado: true,
  creadoEn: true,
  clienteId: true,
  motorizadoActualId: true,
  sucursal: {
    select: {
      id: true,
      nombre: true,
      tienda: { select: { id: true, nombre: true } },
    },
  },
} satisfies Prisma.PedidoSelect;

type PedidoConSucursalYTienda = Prisma.PedidoGetPayload<{
  select: typeof REPORTE_PEDIDO_SELECT;
}>;

function mapearFilaPedido(pedido: PedidoConSucursalYTienda): ReportePedidoRow {
  return {
    id: pedido.id,
    codigoPedido: pedido.codigoPedido,
    estado: pedido.estado,
    creadoEn: pedido.creadoEn,
    sucursalId: pedido.sucursal.id,
    sucursalNombre: pedido.sucursal.nombre,
    tiendaId: pedido.sucursal.tienda.id,
    tiendaNombre: pedido.sucursal.tienda.nombre,
    clienteId: pedido.clienteId,
    motorizadoActualId: pedido.motorizadoActualId,
  };
}

function filtroFechas(
  fechaDesde?: Date,
  fechaHasta?: Date,
): Prisma.DateTimeFilter | undefined {
  if (!fechaDesde && !fechaHasta) {
    return undefined;
  }
  return {
    ...(fechaDesde ? { gte: fechaDesde } : {}),
    ...(fechaHasta ? { lte: fechaHasta } : {}),
  };
}

@Injectable()
export class ReportesRepository implements IReportesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async reportePedidos(
    params: ReportePedidosParams,
  ): Promise<{ data: ReportePedidoRow[]; total: number }> {
    const creadoEn = filtroFechas(params.fechaDesde, params.fechaHasta);
    const where: Prisma.PedidoWhereInput = {
      ...(params.estado ? { estado: params.estado } : {}),
      ...(params.motorizadoId
        ? { motorizadoActualId: params.motorizadoId }
        : {}),
      ...(params.tiendaId ? { sucursal: { tiendaId: params.tiendaId } } : {}),
      ...(creadoEn ? { creadoEn } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { creadoEn: 'desc' },
        select: REPORTE_PEDIDO_SELECT,
      }),
      this.prisma.pedido.count({ where }),
    ]);

    return { data: rows.map(mapearFilaPedido), total };
  }

  async reporteEntregas(
    params: ReporteEntregasParams,
  ): Promise<{ data: ReportePedidoRow[]; total: number }> {
    const creadoEn = filtroFechas(params.fechaDesde, params.fechaHasta);
    const where: Prisma.PedidoWhereInput = {
      estado: params.estado
        ? params.estado
        : {
            in: [
              EstadoPedido.entregado,
              EstadoPedido.cancelado,
              EstadoPedido.devuelto,
              EstadoPedido.reprogramado,
            ],
          },
      ...(creadoEn ? { creadoEn } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { creadoEn: 'desc' },
        select: REPORTE_PEDIDO_SELECT,
      }),
      this.prisma.pedido.count({ where }),
    ]);

    return { data: rows.map(mapearFilaPedido), total };
  }

  async reporteMotorizados(
    params: ReporteMotorizadosParams,
  ): Promise<{ data: ReporteMotorizadoRow[]; total: number }> {
    const whereMotorizado: Prisma.PerfilMotorizadoWhereInput = {
      ...(params.motorizadoId ? { id: params.motorizadoId } : {}),
    };

    const [motorizados, total] = await Promise.all([
      this.prisma.perfilMotorizado.findMany({
        where: whereMotorizado,
        skip: params.skip,
        take: params.take,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          placa: true,
          estado: true,
          usuario: { select: { nombres: true, apellidos: true } },
        },
      }),
      this.prisma.perfilMotorizado.count({ where: whereMotorizado }),
    ]);

    if (motorizados.length === 0) {
      return { data: [], total };
    }

    const motorizadoIds = motorizados.map((m) => m.id);
    const creadoEn = filtroFechas(params.fechaDesde, params.fechaHasta);

    // 3 consultas agregadas en total, sin importar la cantidad de
    // motorizados de la pagina (evita N+1).
    const [atendidosGrupo, entregasGrupo, incidentesGrupo] = await Promise.all([
      this.prisma.pedido.groupBy({
        by: ['motorizadoActualId'],
        where: {
          motorizadoActualId: { in: motorizadoIds },
          ...(creadoEn ? { creadoEn } : {}),
        },
        _count: { _all: true },
      }),
      this.prisma.pedido.groupBy({
        by: ['motorizadoActualId'],
        where: {
          motorizadoActualId: { in: motorizadoIds },
          estado: EstadoPedido.entregado,
          ...(creadoEn ? { creadoEn } : {}),
        },
        _count: { _all: true },
      }),
      this.prisma.incidente.groupBy({
        by: ['motorizadoId'],
        where: { motorizadoId: { in: motorizadoIds } },
        _count: { _all: true },
      }),
    ]);

    const atendidosPorMotorizado = new Map(
      atendidosGrupo.map((g) => [
        g.motorizadoActualId?.toString(),
        g._count._all,
      ]),
    );
    const entregasPorMotorizado = new Map(
      entregasGrupo.map((g) => [
        g.motorizadoActualId?.toString(),
        g._count._all,
      ]),
    );
    const incidentesPorMotorizado = new Map(
      incidentesGrupo.map((g) => [g.motorizadoId.toString(), g._count._all]),
    );

    const data: ReporteMotorizadoRow[] = motorizados.map((m) => ({
      motorizadoId: m.id,
      nombres: m.usuario.nombres,
      apellidos: m.usuario.apellidos,
      placa: m.placa,
      estado: m.estado,
      pedidosAtendidos: atendidosPorMotorizado.get(m.id.toString()) ?? 0,
      entregas: entregasPorMotorizado.get(m.id.toString()) ?? 0,
      incidentes: incidentesPorMotorizado.get(m.id.toString()) ?? 0,
    }));

    return { data, total };
  }
}
