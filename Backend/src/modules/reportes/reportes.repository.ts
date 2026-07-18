import { Injectable } from '@nestjs/common';
import { EstadoPedido, MetodoPago, Prisma } from '@prisma/client';
import { calcularEstadoPagoPedido } from '../../common/utils/estado-pago-pedido.util';
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
  valorProducto: true,
  costoEnvio: true,
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

function mapearFilaPedido(
  pedido: PedidoConSucursalYTienda,
  resumenPago: { totalPagado: number; metodosUtilizados: MetodoPago[] },
): ReportePedidoRow {
  const totalPedido =
    (Number(pedido.valorProducto) || 0) + (Number(pedido.costoEnvio) || 0);
  const { totalPagado, saldoPendiente, estadoPago } = calcularEstadoPagoPedido(
    totalPedido,
    resumenPago.totalPagado,
  );

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
    totalPagado,
    saldoPendiente,
    estadoPago,
    metodosUtilizados: resumenPago.metodosUtilizados,
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

    return { data: await this.enriquecerConPagos(rows), total };
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

    return { data: await this.enriquecerConPagos(rows), total };
  }

  /**
   * Enriquece las filas de Pedido con datos derivados de pagos (Fase 21)
   * usando una unica consulta agregada para toda la pagina, sin importar
   * su tamaño (mismo patron que `reporteMotorizados`, no un query por
   * fila). Compartida por `reportePedidos` y `reporteEntregas` — ambos
   * reportes muestran un subconjunto distinto de estos mismos campos.
   */
  private async enriquecerConPagos(
    pedidos: PedidoConSucursalYTienda[],
  ): Promise<ReportePedidoRow[]> {
    if (pedidos.length === 0) return [];

    const pedidoIds = pedidos.map((pedido) => pedido.id);
    const grupos = await this.prisma.pago.groupBy({
      by: ['pedidoId', 'metodoPago'],
      where: { pedidoId: { in: pedidoIds } },
      _sum: { monto: true },
    });

    const resumenPorPedido = new Map<
      string,
      { totalPagado: number; metodosUtilizados: MetodoPago[] }
    >();
    for (const grupo of grupos) {
      const clave = grupo.pedidoId.toString();
      const actual = resumenPorPedido.get(clave) ?? {
        totalPagado: 0,
        metodosUtilizados: [],
      };
      actual.totalPagado += grupo._sum.monto?.toNumber() ?? 0;
      actual.metodosUtilizados.push(grupo.metodoPago);
      resumenPorPedido.set(clave, actual);
    }

    return pedidos.map((pedido) =>
      mapearFilaPedido(
        pedido,
        resumenPorPedido.get(pedido.id.toString()) ?? {
          totalPagado: 0,
          metodosUtilizados: [],
        },
      ),
    );
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
      pedidosAtendidos: atendidosPorMotorizado.get(m.id.toString()) ?? 0,
      entregas: entregasPorMotorizado.get(m.id.toString()) ?? 0,
      incidentes: incidentesPorMotorizado.get(m.id.toString()) ?? 0,
    }));

    return { data, total };
  }
}
