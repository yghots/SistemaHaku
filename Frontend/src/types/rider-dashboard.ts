import type { EstadoPedido } from './pedido';
import type { ReportePedidoItem } from './reporte';

/**
 * Forma del objeto que arma `RiderDashboardService` a partir de servicios
 * ya existentes (ningún endpoint propio: `GET /dashboard/motorizado` no
 * existe en el backend). Cada indicador es `number | null`: `null`
 * significa que la consulta subyacente falló — nunca se inventa un valor
 * en su lugar.
 */
export interface RiderDashboardKpis {
  /** Pedidos en estado `asignado` (esperando que el motorizado confirme el recojo). */
  pedidosPendientes: number | null;
  /** Pedidos en estado `en_ruta`. */
  pedidosEnRuta: number | null;
  /**
   * Pedidos en estado `entregado` creados hoy. El backend no registra la
   * fecha real de entrega (`Pedido` solo tiene `creadoEn`) — se aproxima
   * con "creado hoy y actualmente entregado"; puede subestimar pedidos
   * creados un dia anterior y entregados hoy (ver limitacion documentada
   * en FRONTEND_PROGRESS.md).
   */
  pedidosEntregadosHoy: number | null;
  /** Pedidos creados hoy (cualquier estado) asignados a este motorizado. */
  pedidosAtendidosHoy: number | null;
  /** Total historico de incidentes reportados por este motorizado (el backend no registra fecha de incidente, no se puede acotar a "hoy"). */
  incidentesRegistrados: number | null;
}

/** Datos del "proximo pedido operativo" — el activo (asignado/recogido/en_ruta) mas antiguo (FIFO). */
export interface RiderProximoPedido {
  id: string;
  codigoPedido: string;
  clienteNombre: string;
  direccionEntrega: string;
  telefonoContacto: string | null;
  estado: EstadoPedido;
}

export interface RiderDashboardData {
  /** `false` si el usuario autenticado (rol motorizado) todavia no tiene un perfil operativo creado por un administrador. */
  tienePerfil: boolean;
  kpis: RiderDashboardKpis;
  /** `null` si no hay ningun pedido activo, o si no se pudo obtener su detalle. */
  proximoPedido: RiderProximoPedido | null;
  /** Los pedidos mas recientes (cualquier estado) asignados a este motorizado, o `null` si la consulta fallo. */
  pedidosRecientes: ReportePedidoItem[] | null;
}
