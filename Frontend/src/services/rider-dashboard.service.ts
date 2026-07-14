import dayjs from 'dayjs';
import { ClientesService } from './clientes.service';
import { IncidentesService } from './incidentes.service';
import { MotorizadosService } from './motorizados.service';
import { PedidosService } from './pedidos.service';
import { ReportesService } from './reportes.service';
import { SessionService } from './session.service';
import type { EstadoPedido } from '../types/pedido';
import type { ReportePedidoItem } from '../types/reporte';
import type {
  RiderDashboardData,
  RiderDashboardKpis,
  RiderProximoPedido,
} from '../types/rider-dashboard';

/** Cuantos pedidos recientes se muestran en el widget correspondiente. */
const PEDIDOS_RECIENTES_LIMIT = 5;

/** Limite maximo de una sola pagina (el que admite el backend) usado para traer todos los pedidos del motorizado en un unico request. */
const PEDIDOS_BULK_LIMIT = 100;

/** Estados desde los que un pedido todavia requiere una accion del motorizado — candidatos a "proximo pedido". */
const ESTADOS_ACTIVOS: EstadoPedido[] = ['asignado', 'recogido', 'en_ruta'];

const VACIO: RiderDashboardData = {
  tienePerfil: false,
  kpis: {
    pedidosPendientes: null,
    pedidosEnRuta: null,
    pedidosEntregadosHoy: null,
    pedidosAtendidosHoy: null,
    incidentesRegistrados: null,
  },
  proximoPedido: null,
  pedidosRecientes: null,
};

/**
 * Fachada del Dashboard del Motorizado (Fase 12): unico punto que la
 * pagina consulta. Reutiliza internamente `MotorizadosService`,
 * `ReportesService`, `PedidosService`, `ClientesService`,
 * `IncidentesService` y `SessionService` — la pagina nunca los importa
 * directamente. No existe un endpoint `GET /dashboard/motorizado` en el
 * backend: si alguna vez se agrega, solo este archivo cambiaria.
 */
export const RiderDashboardService = {
  async obtenerDashboard(): Promise<RiderDashboardData> {
    const sesion = SessionService.getCurrentUser();
    if (!sesion) return VACIO;

    const perfil = await MotorizadosService.buscarPorUsuarioId(sesion.id);
    if (!perfil) return VACIO;

    const motorizadoId = Number(perfil.id);

    // `ReportesService.reportePedidos` (a diferencia de `PedidosService.listar`)
    // si admite filtrar por `motorizadoId` en el propio backend — evita el
    // recorrido de todas las paginas que si hace falta en Mis Pedidos/Historial
    // (Fase 8) para el CRUD de Pedidos, que no tiene ese filtro.
    const [pedidosResult, incidentesResult] = await Promise.allSettled([
      ReportesService.reportePedidos({ page: 1, limit: PEDIDOS_BULK_LIMIT, motorizadoId }),
      IncidentesService.listar({ page: 1, limit: 1, motorizadoId }),
    ]);

    const pedidos = pedidosResult.status === 'fulfilled' ? pedidosResult.value.data : null;
    const incidentesRegistrados =
      incidentesResult.status === 'fulfilled' ? incidentesResult.value.total : null;

    const kpis = computeKpis(pedidos, incidentesRegistrados);
    const proximoPedidoItem = pedidos ? elegirProximoPedido(pedidos) : null;
    const proximoPedido = proximoPedidoItem
      ? await obtenerDetalleProximoPedido(proximoPedidoItem)
      : null;

    return {
      tienePerfil: true,
      kpis,
      proximoPedido,
      pedidosRecientes: pedidos ? pedidos.slice(0, PEDIDOS_RECIENTES_LIMIT) : null,
    };
  },
};

function esHoy(fechaIso: string): boolean {
  return dayjs(fechaIso).isSame(dayjs(), 'day');
}

function computeKpis(
  pedidos: ReportePedidoItem[] | null,
  incidentesRegistrados: number | null,
): RiderDashboardKpis {
  if (!pedidos) {
    return {
      pedidosPendientes: null,
      pedidosEnRuta: null,
      pedidosEntregadosHoy: null,
      pedidosAtendidosHoy: null,
      incidentesRegistrados,
    };
  }

  return {
    pedidosPendientes: pedidos.filter((pedido) => pedido.estado === 'asignado').length,
    pedidosEnRuta: pedidos.filter((pedido) => pedido.estado === 'en_ruta').length,
    pedidosEntregadosHoy: pedidos.filter(
      (pedido) => pedido.estado === 'entregado' && esHoy(pedido.creadoEn),
    ).length,
    pedidosAtendidosHoy: pedidos.filter((pedido) => esHoy(pedido.creadoEn)).length,
    incidentesRegistrados,
  };
}

/** El pedido activo mas antiguo (FIFO): el que lleva mas tiempo esperando una accion del motorizado. */
function elegirProximoPedido(pedidos: ReportePedidoItem[]): ReportePedidoItem | null {
  const activos = pedidos.filter((pedido) => ESTADOS_ACTIVOS.includes(pedido.estado));
  if (activos.length === 0) return null;
  const ordenados = [...activos].sort(
    (a, b) => dayjs(a.creadoEn).valueOf() - dayjs(b.creadoEn).valueOf(),
  );
  return ordenados[0] ?? null;
}

async function obtenerDetalleProximoPedido(
  item: ReportePedidoItem,
): Promise<RiderProximoPedido | null> {
  const [pedidoResult, clienteResult] = await Promise.allSettled([
    PedidosService.buscarPorId(item.id),
    ClientesService.buscarPorId(item.clienteId),
  ]);

  if (pedidoResult.status !== 'fulfilled') return null;
  const pedido = pedidoResult.value;
  const clienteNombre =
    clienteResult.status === 'fulfilled' ? clienteResult.value.nombreCompleto : item.clienteId;

  return {
    id: pedido.id,
    codigoPedido: pedido.codigoPedido,
    clienteNombre,
    direccionEntrega: pedido.direccionEntrega,
    telefonoContacto: pedido.telefonoContacto,
    estado: pedido.estado,
  };
}
