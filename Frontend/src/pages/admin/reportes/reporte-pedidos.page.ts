import { Ban, CheckCircle2, Clock, Package } from 'lucide';
import { infoAlert } from '../../../components/alert/alert';
import { Loader } from '../../../components/loader/loader';
import { PageHeader } from '../../../components/page-header/page-header';
import {
  ReportFilters,
  type ReportFilterField,
} from '../../../components/report-filters/report-filters';
import { ResourceTable } from '../../../components/resource-table/resource-table';
import type { SelectOption } from '../../../components/select/select';
import { StatCard } from '../../../components/stat-card/stat-card';
import { ESTADO_PEDIDO_LABEL } from '../../../constants/estado-pedido';
import { ClientesService } from '../../../services/clientes.service';
import { HttpError } from '../../../services/http/http-error';
import { MotorizadosService } from '../../../services/motorizados.service';
import { ReportesService } from '../../../services/reportes.service';
import { TiendasService } from '../../../services/tiendas.service';
import type { EstadoPedido } from '../../../types/pedido';
import { el } from '../../../utils/dom';
import { fetchAllPages } from '../../../utils/fetch-all-pages';
import { buildReportePedidoColumns } from './reporte-pedido-columns';

const ESTADO_OPTIONS: SelectOption[] = Object.entries(ESTADO_PEDIDO_LABEL).map(
  ([value, label]) => ({ value, label }),
);

/**
 * Reporte de Pedidos (CU18): filtros por rango de fechas, tienda, estado
 * y motorizado — exactamente los que soporta `ReportePedidosQueryDto`.
 * La tabla reutiliza `ResourceTable` (consulta el backend pagina por
 * pagina, sin su propia barra de filtros — los filtros externos de
 * `ReportFilters` son la unica fuente). Los KPIs se calculan aparte, con
 * `fetchAllPages` sobre el mismo endpoint y los mismos filtros, para
 * reflejar el total real (no solo la pagina visible).
 */
export function ReportePedidosPage(): HTMLElement {
  let clienteLabelById = new Map<string, string>();
  let motorizadoLabelById = new Map<string, string>();
  let currentParams: Record<string, string> = {};

  const kpiSlot = buildLoadingKpis();
  const tableSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando pedidos' }),
  );

  const container = el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Reporte de Pedidos',
      description:
        'Filtra y analiza los pedidos registrados por rango de fechas, tienda, estado o motorizado.',
      breadcrumb: [{ label: 'Reportes' }, { label: 'Pedidos' }],
    }),
    el('div', { className: 'flex justify-center py-6' }, Loader({ label: 'Cargando filtros' })),
  );

  void init();

  function buildLoadingKpis(): HTMLElement {
    return el(
      'div',
      { className: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4' },
      StatCard({ label: 'Total pedidos', value: '—', icon: Package, loading: true }),
      StatCard({ label: 'Pendientes', value: '—', icon: Clock, loading: true }),
      StatCard({ label: 'Entregados', value: '—', icon: CheckCircle2, loading: true }),
      StatCard({ label: 'Cancelados', value: '—', icon: Ban, loading: true }),
    );
  }

  async function init(): Promise<void> {
    try {
      const [tiendas, motorizados, clientes] = await Promise.all([
        TiendasService.listar({ page: 1, limit: 100 }),
        MotorizadosService.listar({ page: 1, limit: 100 }),
        ClientesService.listar({ page: 1, limit: 100 }),
      ]);

      clienteLabelById = new Map(
        clientes.data.map((cliente) => [cliente.id, cliente.nombreCompleto]),
      );
      motorizadoLabelById = new Map(
        motorizados.data.map((motorizado) => [motorizado.id, motorizado.placa]),
      );

      const fields: ReportFilterField[] = [
        { type: 'dateRange', nameDesde: 'fechaDesde', nameHasta: 'fechaHasta' },
        {
          type: 'select',
          name: 'tiendaId',
          label: 'Tienda',
          placeholder: 'Todas las tiendas',
          options: tiendas.data.map((tienda) => ({ value: tienda.id, label: tienda.nombre })),
        },
        {
          type: 'select',
          name: 'estado',
          label: 'Estado',
          placeholder: 'Todos los estados',
          options: ESTADO_OPTIONS,
        },
        {
          type: 'select',
          name: 'motorizadoId',
          label: 'Motorizado',
          placeholder: 'Todos los motorizados',
          options: motorizados.data.map((motorizado) => ({
            value: motorizado.id,
            label: motorizado.placa,
          })),
        },
      ];

      const filtersHandle = ReportFilters({
        fields,
        onApply: (params) => {
          currentParams = params;
          buildTable();
          void loadKpis();
        },
      });

      container.replaceChildren(
        PageHeader({
          title: 'Reporte de Pedidos',
          description:
            'Filtra y analiza los pedidos registrados por rango de fechas, tienda, estado o motorizado.',
          breadcrumb: [{ label: 'Reportes' }, { label: 'Pedidos' }],
        }),
        filtersHandle.element,
        kpiSlot,
        tableSlot,
      );

      buildTable();
      await loadKpis();
    } catch (error) {
      await showApiError(error);
    }
  }

  function buildTable(): void {
    const columns = buildReportePedidoColumns({
      clienteLabel: (id) => clienteLabelById.get(id) ?? id,
      motorizadoLabel: (id) => motorizadoLabelById.get(id) ?? id,
    });

    const table = ResourceTable({
      columns,
      getRowKey: (row) => row.id,
      fetchPage: (params) =>
        ReportesService.reportePedidos({
          page: params.page,
          limit: params.limit,
          fechaDesde: currentParams.fechaDesde,
          fechaHasta: currentParams.fechaHasta,
          tiendaId: currentParams.tiendaId ? Number(currentParams.tiendaId) : undefined,
          estado: (currentParams.estado as EstadoPedido) || undefined,
          motorizadoId: currentParams.motorizadoId ? Number(currentParams.motorizadoId) : undefined,
        }),
      emptyTitle: 'Sin resultados',
      emptyDescription: 'No hay pedidos que coincidan con los filtros seleccionados.',
    });

    tableSlot.replaceChildren(table.element);
  }

  async function loadKpis(): Promise<void> {
    kpiSlot.replaceChildren(...buildLoadingKpis().children);
    try {
      const filas = await fetchAllPages((page) =>
        ReportesService.reportePedidos({
          page: page.page,
          limit: page.limit,
          fechaDesde: currentParams.fechaDesde,
          fechaHasta: currentParams.fechaHasta,
          tiendaId: currentParams.tiendaId ? Number(currentParams.tiendaId) : undefined,
          estado: (currentParams.estado as EstadoPedido) || undefined,
          motorizadoId: currentParams.motorizadoId ? Number(currentParams.motorizadoId) : undefined,
        }),
      );

      const total = filas.length;
      const pendientes = filas.filter((fila) => fila.estado === 'pendiente').length;
      const entregados = filas.filter((fila) => fila.estado === 'entregado').length;
      const cancelados = filas.filter((fila) => fila.estado === 'cancelado').length;

      kpiSlot.replaceChildren(
        StatCard({ label: 'Total pedidos', value: total, icon: Package, variant: 'brand' }),
        StatCard({ label: 'Pendientes', value: pendientes, icon: Clock, variant: 'neutral' }),
        StatCard({
          label: 'Entregados',
          value: entregados,
          icon: CheckCircle2,
          variant: 'success',
        }),
        StatCard({ label: 'Cancelados', value: cancelados, icon: Ban, variant: 'danger' }),
      );
    } catch (error) {
      await showApiError(error);
    }
  }

  async function showApiError(error: unknown): Promise<void> {
    const message =
      error instanceof HttpError ? error.message : 'No se pudo conectar con el servidor.';
    await infoAlert({ title: 'No se pudo cargar el reporte', text: message, icon: 'error' });
  }

  return container;
}
