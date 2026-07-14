import type { EstadoMotorizado } from './perfil-motorizado';
import type { EstadoPedido } from './pedido';

/**
 * Contrato exacto de Backend/src/modules/reportes (revisado directamente
 * en reporte-pedidos-query.dto.ts, reporte-entregas-query.dto.ts,
 * reporte-motorizados-query.dto.ts, reporte-pedido-item.dto.ts,
 * reporte-motorizado-item.dto.ts, y reportes-repository.interface.ts para
 * `ESTADOS_REPORTE_ENTREGAS`). Modulo de solo consulta: unicamente
 * endpoints GET, sin crear/actualizar/eliminar.
 */

/** Igual a ReportePedidoItemDto — fila compartida por el Reporte de Pedidos y el Reporte de Entregas. */
export interface ReportePedidoItem {
  id: string;
  codigoPedido: string;
  estado: EstadoPedido;
  creadoEn: string;
  sucursalId: string;
  sucursalNombre: string;
  tiendaId: string;
  tiendaNombre: string;
  clienteId: string;
  motorizadoActualId: string | null;
}

/** Igual a ReportePedidosQueryDto. */
export interface ReportePedidosParams {
  page: number;
  limit: number;
  fechaDesde?: string;
  fechaHasta?: string;
  tiendaId?: number;
  estado?: EstadoPedido;
  motorizadoId?: number;
}

/**
 * Igual a ReporteEntregasQueryDto. `estado`, si se envia, debe ser uno de
 * `ESTADOS_REPORTE_ENTREGAS` (el backend responde 400 en caso contrario).
 */
export interface ReporteEntregasParams {
  page: number;
  limit: number;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: EstadoPedido;
}

/** Igual a `ESTADOS_REPORTE_ENTREGAS` (reportes-repository.interface.ts, backend). */
export const ESTADOS_REPORTE_ENTREGAS: EstadoPedido[] = [
  'entregado',
  'cancelado',
  'devuelto',
  'reprogramado',
];

/** Igual a ReporteMotorizadoItemDto. */
export interface ReporteMotorizadoItem {
  motorizadoId: string;
  placa: string;
  estado: EstadoMotorizado;
  pedidosAtendidos: number;
  entregas: number;
  incidentes: number;
  productividad: number;
}

/** Igual a ReporteMotorizadosQueryDto. */
export interface ReporteMotorizadosParams {
  page: number;
  limit: number;
  motorizadoId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}
