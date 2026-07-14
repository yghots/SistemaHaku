import { EstadoMotorizado, EstadoPedido } from '@prisma/client';

export const REPORTES_REPOSITORY = Symbol('REPORTES_REPOSITORY');

// CU19 (Fase 10): el reporte de entregas se limita a los estados finales
// del flujo de un pedido. Si se filtra por 'estado', debe ser uno de estos.
export const ESTADOS_REPORTE_ENTREGAS: EstadoPedido[] = [
  EstadoPedido.entregado,
  EstadoPedido.cancelado,
  EstadoPedido.devuelto,
  EstadoPedido.reprogramado,
];

export interface ReportePedidoRow {
  id: bigint;
  codigoPedido: string;
  estado: EstadoPedido;
  creadoEn: Date;
  sucursalId: bigint;
  sucursalNombre: string;
  tiendaId: bigint;
  tiendaNombre: string;
  clienteId: bigint;
  motorizadoActualId: bigint | null;
}

export interface ReportePedidosParams {
  skip: number;
  take: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  tiendaId?: bigint;
  estado?: EstadoPedido;
  motorizadoId?: bigint;
}

export interface ReporteEntregasParams {
  skip: number;
  take: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  estado?: EstadoPedido;
}

export interface ReporteMotorizadoRow {
  motorizadoId: bigint;
  nombres: string;
  apellidos: string;
  placa: string;
  estado: EstadoMotorizado;
  pedidosAtendidos: number;
  entregas: number;
  incidentes: number;
}

export interface ReporteMotorizadosParams {
  skip: number;
  take: number;
  motorizadoId?: bigint;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

// Modulo de solo consulta (CU18/CU19/CU20): no expone crear, actualizar ni
// eliminar. 'pedidosAtendidos' y 'entregas' se calculan sobre
// motorizadoActualId (unica relacion directa entre Pedido y
// PerfilMotorizado en el modelo actual: una reasignacion sobrescribe este
// campo y el evento de asignacion inicial no guarda motorizadoId en
// historial_pedido, por lo que no es posible reconstruir el trail completo
// de motorizados que tuvo un pedido antes de la reasignacion mas reciente).
// Ver DEVELOPMENT_PROGRESS.md (Fase 10) para el detalle de esta limitacion.
export interface IReportesRepository {
  reportePedidos(
    params: ReportePedidosParams,
  ): Promise<{ data: ReportePedidoRow[]; total: number }>;
  reporteEntregas(
    params: ReporteEntregasParams,
  ): Promise<{ data: ReportePedidoRow[]; total: number }>;
  reporteMotorizados(
    params: ReporteMotorizadosParams,
  ): Promise<{ data: ReporteMotorizadoRow[]; total: number }>;
}
