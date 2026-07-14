import type { ReportePedidoItem } from './reporte';

/**
 * Forma del objeto que arma `DashboardService` a partir de servicios ya
 * existentes (ningún endpoint propio: `GET /dashboard` no existe en el
 * backend). Cada indicador es `number | null`: `null` significa que la
 * consulta subyacente falló — nunca se inventa un valor en su lugar, la
 * página debe mostrar un estado de error solo para ese indicador.
 */
export interface DashboardKpis {
  /** Pedidos creados hoy (`creadoEn` entre hoy y mañana). */
  pedidosHoy: number | null;
  /** Pedidos en estado `pendiente` (total actual, sin importar cuándo se crearon). */
  pedidosPendientes: number | null;
  /** Pedidos en estado `en_ruta` (total actual). */
  pedidosEnRuta: number | null;
  /** Pedidos en estado `entregado` (total historico). */
  pedidosEntregados: number | null;
  /** Perfiles de motorizado con estado distinto de `inactivo` (`disponible` + `ocupado`). */
  motorizadosActivos: number | null;
  /** Total de clientes registrados. */
  clientesRegistrados: number | null;
  /** Total de tiendas registradas. */
  tiendasRegistradas: number | null;
  /** Total de sucursales registradas. */
  sucursalesRegistradas: number | null;
}

/** `ReportePedidoItem` (ya trae tiendaNombre/sucursalNombre) más el nombre del cliente, resuelto aparte por `DashboardService`. */
export type DashboardPedidoReciente = ReportePedidoItem & { clienteNombre: string };

export interface DashboardData {
  kpis: DashboardKpis;
  /**
   * Los `N` pedidos mas recientes (por fecha de creacion), o `null` si la
   * consulta fallo. Se obtienen de `ReportesService.reportePedidos`
   * (ordena `creadoEn: desc` de forma nativa, a diferencia de
   * `PedidosService.listar`).
   */
  pedidosRecientes: DashboardPedidoReciente[] | null;
}
