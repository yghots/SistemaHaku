import { Ban, CheckCircle2, RotateCcw, Undo2 } from 'lucide';
import { infoAlert } from '../../../components/alert/alert';
import { ExportButton } from '../../../components/export-button/export-button';
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
import { SessionService } from '../../../services/session.service';
import type { EstadoPedido } from '../../../types/pedido';
import { ESTADOS_REPORTE_ENTREGAS } from '../../../types/reporte';
import { downloadBlob } from '../../../utils/download-file';
import { el } from '../../../utils/dom';
import { fetchAllPages } from '../../../utils/fetch-all-pages';
import { formatMotorizado } from '../../../utils/format-motorizado';
import { nombreCompleto } from '../../../utils/nombre-completo';
import {
  buildReporteEntregasPagoColumns,
  buildReportePedidoColumns,
} from './reporte-pedido-columns';

const ESTADO_OPTIONS: SelectOption[] = ESTADOS_REPORTE_ENTREGAS.map((value) => ({
  value,
  label: ESTADO_PEDIDO_LABEL[value],
}));

/**
 * Reporte de Entregas (CU19): filtros por rango de fechas y estado —
 * exactamente los que soporta `ReporteEntregasQueryDto`. El selector de
 * estado solo ofrece los 4 estados finales que el backend acepta para
 * este reporte (`ESTADOS_REPORTE_ENTREGAS`); enviar cualquier otro
 * responde 400. Misma arquitectura que Reporte de Pedidos: `ResourceTable`
 * consulta el backend pagina por pagina, los KPIs se calculan aparte con
 * `fetchAllPages`.
 */
export function ReporteEntregasPage(): HTMLElement {
  let clienteLabelById = new Map<string, string>();
  let motorizadoLabelById = new Map<string, string>();
  let currentParams: Record<string, string> = {};

  const kpiSlot = buildLoadingKpis();
  const tableSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando entregas' }),
  );

  const exportButton = ExportButton({
    onExport: async (formato) => {
      const usuario = SessionService.getCurrentUser();
      const archivo = await ReportesService.exportarReporteEntregas({
        fechaDesde: currentParams.fechaDesde,
        fechaHasta: currentParams.fechaHasta,
        estado: (currentParams.estado as EstadoPedido) || undefined,
        formato,
        generadoPor: usuario ? nombreCompleto(usuario) : 'Usuario desconocido',
      });
      downloadBlob(archivo.blob, archivo.filename);
    },
  });

  const container = el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Reporte de Entregas',
      description:
        'Analiza los pedidos ya cerrados: entregados, cancelados, devueltos o reprogramados.',
      breadcrumb: [{ label: 'Reportes' }, { label: 'Entregas' }],
      actions: exportButton,
    }),
    el('div', { className: 'flex justify-center py-6' }, Loader({ label: 'Cargando filtros' })),
  );

  void init();

  function buildLoadingKpis(): HTMLElement {
    return el(
      'div',
      { className: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5' },
      StatCard({ label: 'Total', value: '—', icon: CheckCircle2, loading: true }),
      StatCard({ label: 'Entregados', value: '—', icon: CheckCircle2, loading: true }),
      StatCard({ label: 'Cancelados', value: '—', icon: Ban, loading: true }),
      StatCard({ label: 'Devueltos', value: '—', icon: Undo2, loading: true }),
      StatCard({ label: 'Reprogramados', value: '—', icon: RotateCcw, loading: true }),
    );
  }

  async function init(): Promise<void> {
    try {
      const [motorizados, clientes] = await Promise.all([
        MotorizadosService.listar({ page: 1, limit: 100 }),
        ClientesService.listar({ page: 1, limit: 100 }),
      ]);

      clienteLabelById = new Map(
        clientes.data.map((cliente) => [cliente.id, cliente.nombreCompleto]),
      );
      motorizadoLabelById = new Map(
        motorizados.data.map((motorizado) => [motorizado.id, formatMotorizado(motorizado)]),
      );

      const fields: ReportFilterField[] = [
        { type: 'dateRange', nameDesde: 'fechaDesde', nameHasta: 'fechaHasta' },
        {
          type: 'select',
          name: 'estado',
          label: 'Estado',
          placeholder: 'Todos (entregado, cancelado, devuelto, reprogramado)',
          options: ESTADO_OPTIONS,
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
          title: 'Reporte de Entregas',
          description:
            'Analiza los pedidos ya cerrados: entregados, cancelados, devueltos o reprogramados.',
          breadcrumb: [{ label: 'Reportes' }, { label: 'Entregas' }],
          actions: exportButton,
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
    const columns = [
      ...buildReportePedidoColumns({
        clienteLabel: (id) => clienteLabelById.get(id) ?? id,
        motorizadoLabel: (id) => motorizadoLabelById.get(id) ?? id,
      }),
      ...buildReporteEntregasPagoColumns(),
    ];

    const table = ResourceTable({
      columns,
      getRowKey: (row) => row.id,
      fetchPage: (params) =>
        ReportesService.reporteEntregas({
          page: params.page,
          limit: params.limit,
          fechaDesde: currentParams.fechaDesde,
          fechaHasta: currentParams.fechaHasta,
          estado: (currentParams.estado as EstadoPedido) || undefined,
        }),
      emptyTitle: 'Sin resultados',
      emptyDescription: 'No hay entregas que coincidan con los filtros seleccionados.',
    });

    tableSlot.replaceChildren(table.element);
  }

  async function loadKpis(): Promise<void> {
    kpiSlot.replaceChildren(...buildLoadingKpis().children);
    try {
      const filas = await fetchAllPages((page) =>
        ReportesService.reporteEntregas({
          page: page.page,
          limit: page.limit,
          fechaDesde: currentParams.fechaDesde,
          fechaHasta: currentParams.fechaHasta,
          estado: (currentParams.estado as EstadoPedido) || undefined,
        }),
      );

      const total = filas.length;
      const entregados = filas.filter((fila) => fila.estado === 'entregado').length;
      const cancelados = filas.filter((fila) => fila.estado === 'cancelado').length;
      const devueltos = filas.filter((fila) => fila.estado === 'devuelto').length;
      const reprogramados = filas.filter((fila) => fila.estado === 'reprogramado').length;
      const tasaExito = total > 0 ? Math.round((entregados / total) * 100) : 0;

      kpiSlot.replaceChildren(
        StatCard({
          label: 'Total',
          value: total,
          icon: CheckCircle2,
          variant: 'brand',
          description: `Tasa de entrega exitosa: ${tasaExito}%`,
        }),
        StatCard({
          label: 'Entregados',
          value: entregados,
          icon: CheckCircle2,
          variant: 'success',
        }),
        StatCard({ label: 'Cancelados', value: cancelados, icon: Ban, variant: 'danger' }),
        StatCard({ label: 'Devueltos', value: devueltos, icon: Undo2, variant: 'warning' }),
        StatCard({
          label: 'Reprogramados',
          value: reprogramados,
          icon: RotateCcw,
          variant: 'warning',
        }),
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
