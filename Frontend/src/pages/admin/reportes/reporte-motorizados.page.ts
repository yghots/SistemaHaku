import { Bike, PackageCheck, TrendingUp, Truck } from 'lucide';
import { infoAlert } from '../../../components/alert/alert';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import { ExportButton } from '../../../components/export-button/export-button';
import { Loader } from '../../../components/loader/loader';
import { PageHeader } from '../../../components/page-header/page-header';
import {
  ReportFilters,
  type ReportFilterField,
} from '../../../components/report-filters/report-filters';
import { ResourceTable } from '../../../components/resource-table/resource-table';
import { StatCard } from '../../../components/stat-card/stat-card';
import { HttpError } from '../../../services/http/http-error';
import { MotorizadosService } from '../../../services/motorizados.service';
import { ReportesService } from '../../../services/reportes.service';
import { SessionService } from '../../../services/session.service';
import type { ReporteMotorizadoItem } from '../../../types/reporte';
import { downloadBlob } from '../../../utils/download-file';
import { el } from '../../../utils/dom';
import { fetchAllPages } from '../../../utils/fetch-all-pages';
import { formatMotorizado } from '../../../utils/format-motorizado';
import { nombreCompleto } from '../../../utils/nombre-completo';

const COLUMNS: DataTableColumn<ReporteMotorizadoItem>[] = [
  { key: 'nombres', header: 'Motorizado', render: (row) => formatMotorizado(row) },
  { key: 'pedidosAtendidos', header: 'Pedidos atendidos' },
  { key: 'entregas', header: 'Entregas' },
  { key: 'incidentes', header: 'Incidentes' },
  {
    key: 'productividad',
    header: 'Productividad',
    render: (row) => `${row.productividad.toFixed(1)}%`,
  },
];

/**
 * Reporte de Productividad de Motorizados (CU20): filtros por motorizado
 * y rango de fechas — exactamente los que soporta
 * `ReporteMotorizadosQueryDto`. Cada fila ya trae `pedidosAtendidos`,
 * `entregas`, `incidentes` y `productividad` calculados por el backend;
 * los KPIs agregan esas mismas columnas sobre el conjunto completo que
 * coincide con los filtros (`fetchAllPages`).
 */
export function ReporteMotorizadosPage(): HTMLElement {
  let currentParams: Record<string, string> = {};

  const kpiSlot = buildLoadingKpis();
  const tableSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando motorizados' }),
  );

  const exportButton = ExportButton({
    onExport: async (formato) => {
      const usuario = SessionService.getCurrentUser();
      const archivo = await ReportesService.exportarReporteMotorizados({
        fechaDesde: currentParams.fechaDesde,
        fechaHasta: currentParams.fechaHasta,
        motorizadoId: currentParams.motorizadoId ? Number(currentParams.motorizadoId) : undefined,
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
      title: 'Reporte de Productividad',
      description: 'Pedidos atendidos, entregas, incidentes y productividad por motorizado.',
      breadcrumb: [{ label: 'Reportes' }, { label: 'Productividad' }],
      actions: exportButton,
    }),
    el('div', { className: 'flex justify-center py-6' }, Loader({ label: 'Cargando filtros' })),
  );

  void init();

  function buildLoadingKpis(): HTMLElement {
    return el(
      'div',
      { className: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4' },
      StatCard({ label: 'Motorizados', value: '—', icon: Bike, loading: true }),
      StatCard({ label: 'Pedidos atendidos', value: '—', icon: Truck, loading: true }),
      StatCard({ label: 'Entregas', value: '—', icon: PackageCheck, loading: true }),
      StatCard({ label: 'Productividad general', value: '—', icon: TrendingUp, loading: true }),
    );
  }

  async function init(): Promise<void> {
    try {
      const motorizados = await MotorizadosService.listar({ page: 1, limit: 100 });

      const fields: ReportFilterField[] = [
        { type: 'dateRange', nameDesde: 'fechaDesde', nameHasta: 'fechaHasta' },
        {
          type: 'select',
          name: 'motorizadoId',
          label: 'Motorizado',
          placeholder: 'Todos los motorizados',
          options: motorizados.data.map((motorizado) => ({
            value: motorizado.id,
            label: formatMotorizado(motorizado),
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
          title: 'Reporte de Productividad',
          description: 'Pedidos atendidos, entregas, incidentes y productividad por motorizado.',
          breadcrumb: [{ label: 'Reportes' }, { label: 'Productividad' }],
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
    const table = ResourceTable({
      columns: COLUMNS,
      getRowKey: (row) => row.motorizadoId,
      fetchPage: (params) =>
        ReportesService.reporteMotorizados({
          page: params.page,
          limit: params.limit,
          fechaDesde: currentParams.fechaDesde,
          fechaHasta: currentParams.fechaHasta,
          motorizadoId: currentParams.motorizadoId ? Number(currentParams.motorizadoId) : undefined,
        }),
      emptyTitle: 'Sin resultados',
      emptyDescription: 'No hay motorizados que coincidan con los filtros seleccionados.',
    });

    tableSlot.replaceChildren(table.element);
  }

  async function loadKpis(): Promise<void> {
    kpiSlot.replaceChildren(...buildLoadingKpis().children);
    try {
      const filas = await fetchAllPages((page) =>
        ReportesService.reporteMotorizados({
          page: page.page,
          limit: page.limit,
          fechaDesde: currentParams.fechaDesde,
          fechaHasta: currentParams.fechaHasta,
          motorizadoId: currentParams.motorizadoId ? Number(currentParams.motorizadoId) : undefined,
        }),
      );

      const totalMotorizados = filas.length;
      const totalAtendidos = filas.reduce((sum, fila) => sum + fila.pedidosAtendidos, 0);
      const totalEntregas = filas.reduce((sum, fila) => sum + fila.entregas, 0);
      const totalIncidentes = filas.reduce((sum, fila) => sum + fila.incidentes, 0);
      const productividadGeneral =
        totalAtendidos > 0 ? Math.round((totalEntregas / totalAtendidos) * 1000) / 10 : 0;

      kpiSlot.replaceChildren(
        StatCard({ label: 'Motorizados', value: totalMotorizados, icon: Bike, variant: 'brand' }),
        StatCard({
          label: 'Pedidos atendidos',
          value: totalAtendidos,
          icon: Truck,
          variant: 'info',
        }),
        StatCard({
          label: 'Entregas',
          value: totalEntregas,
          icon: PackageCheck,
          variant: 'success',
          description: `${totalIncidentes} incidente(s) reportado(s)`,
        }),
        StatCard({
          label: 'Productividad general',
          value: `${productividadGeneral}%`,
          icon: TrendingUp,
          variant: productividadGeneral >= 50 ? 'success' : 'warning',
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
