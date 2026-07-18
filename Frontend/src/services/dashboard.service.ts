import dayjs from 'dayjs';
import { ClientesService } from './clientes.service';
import { PedidosService } from './pedidos.service';
import { ReportesService } from './reportes.service';
import { SucursalesService } from './sucursales.service';
import { TiendasService } from './tiendas.service';
import { UsuariosService } from './usuarios.service';
import type { PaginatedResponse } from '../types/api';
import type { DashboardData, DashboardKpis } from '../types/dashboard';

/** Cuantos pedidos recientes se muestran en el widget correspondiente. */
const PEDIDOS_RECIENTES_LIMIT = 8;

/**
 * Fachada del Dashboard (Fase 10): unico punto que la pagina consulta.
 * Reutiliza internamente los servicios ya existentes (Pedidos, Clientes,
 * Tiendas, Sucursales, Motorizados, Reportes) — la pagina nunca los
 * importa directamente. No existe un endpoint `GET /dashboard` en el
 * backend: si alguna vez se agrega, solo este archivo cambiaria (la
 * pagina seguiria llamando a `DashboardService.obtenerDashboard()`
 * exactamente igual, sin tocar ningun componente ni pagina).
 *
 * Todas las consultas se disparan en paralelo con `Promise.allSettled`
 * (no `Promise.all`): un fallo puntual (ej. un servicio caido) no debe
 * tumbar el resto del Dashboard — cada indicador que dependia de esa
 * consulta queda en `null` (ver `types/dashboard.ts`) y el resto se
 * muestra con normalidad.
 */
export const DashboardService = {
  async obtenerDashboard(): Promise<DashboardData> {
    const hoy = dayjs().format('YYYY-MM-DD');
    const manana = dayjs().add(1, 'day').format('YYYY-MM-DD');

    const [
      pedidosHoyResult,
      pedidosPendientesResult,
      pedidosEnRutaResult,
      pedidosEntregadosResult,
      motorizadosActivosResult,
      clientesResult,
      tiendasResult,
      sucursalesResult,
      pedidosRecientesResult,
      clientesLabelResult,
    ] = await Promise.allSettled([
      PedidosService.listar({ page: 1, limit: 1, fechaDesde: hoy, fechaHasta: manana }),
      PedidosService.listar({ page: 1, limit: 1, estado: 'pendiente' }),
      PedidosService.listar({ page: 1, limit: 1, estado: 'en_ruta' }),
      PedidosService.listar({ page: 1, limit: 1, estado: 'entregado' }),
      // Fase 33: "motorizados activos" se deriva de `Usuario.activo`
      // (rol motorizado) — `PerfilMotorizado.estado` se elimino por no
      // participar en ninguna regla de negocio.
      UsuariosService.listar({ page: 1, limit: 1, rol: 'motorizado', activo: true }),
      ClientesService.listar({ page: 1, limit: 1 }),
      TiendasService.listar({ page: 1, limit: 1 }),
      SucursalesService.listar({ page: 1, limit: 1 }),
      // `reportePedidos` ordena `creadoEn: desc` de forma nativa (a
      // diferencia de `PedidosService.listar`, que siempre ordena por id
      // ascendente) y ya trae tiendaNombre/sucursalNombre resueltos.
      ReportesService.reportePedidos({ page: 1, limit: PEDIDOS_RECIENTES_LIMIT }),
      ClientesService.listar({ page: 1, limit: 100 }),
    ]);

    const kpis: DashboardKpis = {
      pedidosHoy: extractTotal(pedidosHoyResult),
      pedidosPendientes: extractTotal(pedidosPendientesResult),
      pedidosEnRuta: extractTotal(pedidosEnRutaResult),
      pedidosEntregados: extractTotal(pedidosEntregadosResult),
      motorizadosActivos: extractTotal(motorizadosActivosResult),
      clientesRegistrados: extractTotal(clientesResult),
      tiendasRegistradas: extractTotal(tiendasResult),
      sucursalesRegistradas: extractTotal(sucursalesResult),
    };

    const clienteLabelById =
      clientesLabelResult.status === 'fulfilled'
        ? new Map(
            clientesLabelResult.value.data.map((cliente) => [cliente.id, cliente.nombreCompleto]),
          )
        : new Map<string, string>();

    const pedidosRecientes =
      pedidosRecientesResult.status === 'fulfilled'
        ? pedidosRecientesResult.value.data.map((pedido) => ({
            ...pedido,
            clienteNombre: clienteLabelById.get(pedido.clienteId) ?? pedido.clienteId,
          }))
        : null;

    return { kpis, pedidosRecientes };
  },
};

function extractTotal(result: PromiseSettledResult<PaginatedResponse<unknown>>): number | null {
  return result.status === 'fulfilled' ? result.value.total : null;
}
