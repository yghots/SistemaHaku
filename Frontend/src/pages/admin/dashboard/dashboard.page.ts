import dayjs from 'dayjs';
import {
  AlertTriangle,
  Bike,
  Building2,
  Clock,
  Navigation,
  PackageCheck,
  PackagePlus,
  Store,
  UsersRound,
  type IconNode,
} from 'lucide';
import { Badge } from '../../../components/badge/badge';
import { Card } from '../../../components/card/card';
import { DataTable, type DataTableColumn } from '../../../components/datatable/datatable';
import { EmptyState } from '../../../components/empty-state/empty-state';
import { Icon } from '../../../components/icon/icon';
import { Loader } from '../../../components/loader/loader';
import { PageHeader } from '../../../components/page-header/page-header';
import { Section } from '../../../components/section/section';
import { StatCard, type StatCardVariant } from '../../../components/stat-card/stat-card';
import { ESTADO_PEDIDO_BADGE_VARIANT, ESTADO_PEDIDO_LABEL } from '../../../constants/estado-pedido';
import { DashboardService } from '../../../services/dashboard.service';
import type { DashboardKpis, DashboardPedidoReciente } from '../../../types/dashboard';
import { el } from '../../../utils/dom';

interface KpiConfig {
  key: keyof DashboardKpis;
  label: string;
  icon: IconNode;
  variant: StatCardVariant;
}

const KPI_CONFIG: KpiConfig[] = [
  { key: 'pedidosHoy', label: 'Pedidos hoy', icon: PackagePlus, variant: 'brand' },
  { key: 'pedidosPendientes', label: 'Pedidos pendientes', icon: Clock, variant: 'neutral' },
  { key: 'pedidosEnRuta', label: 'Pedidos en ruta', icon: Navigation, variant: 'warning' },
  { key: 'pedidosEntregados', label: 'Pedidos entregados', icon: PackageCheck, variant: 'success' },
  { key: 'motorizadosActivos', label: 'Motorizados activos', icon: Bike, variant: 'info' },
  { key: 'clientesRegistrados', label: 'Clientes registrados', icon: UsersRound, variant: 'brand' },
  { key: 'tiendasRegistradas', label: 'Tiendas registradas', icon: Store, variant: 'brand' },
  {
    key: 'sucursalesRegistradas',
    label: 'Sucursales registradas',
    icon: Building2,
    variant: 'brand',
  },
];

const QUICK_ACCESS_ITEMS: Array<{ label: string; href: string; icon: IconNode }> = [
  { label: 'Nuevo pedido', href: '/admin/pedidos', icon: PackagePlus },
  { label: 'Nuevo cliente', href: '/admin/clientes', icon: UsersRound },
  { label: 'Nueva tienda', href: '/admin/tiendas', icon: Store },
  { label: 'Ver incidentes', href: '/admin/incidentes', icon: AlertTriangle },
];

function formatearFechaRelativa(fecha: string): string {
  return dayjs(fecha).fromNow();
}

/**
 * Dashboard ejecutivo (Fase 10): conectado exclusivamente a
 * `DashboardService` (nunca a Pedidos/Clientes/Tiendas/Sucursales/
 * Motorizados/Reportes directamente — esa es responsabilidad de la
 * fachada). Sin datos simulados: cada KPI muestra "—" y una nota si su
 * consulta subyacente falló, en vez de inventar un valor.
 */
export function DashboardPage(): HTMLElement {
  const kpiSlot = buildLoadingKpis();
  const pedidosRecientesSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando pedidos recientes' }),
  );
  const actividadSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando actividad' }),
  );

  const quickAccess = el(
    'div',
    { className: 'grid grid-cols-2 gap-3 sm:grid-cols-4' },
    ...QUICK_ACCESS_ITEMS.map((item) =>
      el(
        'a',
        {
          href: item.href,
          'data-link': 'true',
          className:
            'flex flex-col items-center gap-2 rounded-xl border border-border-default bg-surface-elevated p-4 text-center transition-colors hover:bg-surface-hover',
        },
        el(
          'span',
          {
            className: 'rounded-lg bg-soft-brand-bg p-2 text-soft-brand-fg',
          },
          Icon({ icon: item.icon, size: 18 }),
        ),
        el('span', { className: 'text-sm font-medium text-text-primary' }, item.label),
      ),
    ),
  );

  const container = el(
    'div',
    { className: 'flex flex-col gap-8' },
    PageHeader({
      title: 'Dashboard',
      description: 'Resumen general de la operacion de HAKU Courier.',
      breadcrumb: [{ label: 'Dashboard' }],
    }),
    kpiSlot,
    el(
      'div',
      { className: 'grid grid-cols-1 gap-6 xl:grid-cols-3' },
      el(
        'div',
        { className: 'xl:col-span-2' },
        Section({
          title: 'Pedidos recientes',
          description: 'Los pedidos mas recientes registrados en el sistema.',
          children: pedidosRecientesSlot,
        }),
      ),
      Card({ title: 'Actividad reciente', children: actividadSlot }),
    ),
    Section({ title: 'Accesos rapidos', children: quickAccess }),
  );

  void init();

  async function init(): Promise<void> {
    const data = await DashboardService.obtenerDashboard();
    kpiSlot.replaceWith(renderKpis(data.kpis));
    renderPedidosRecientes(data.pedidosRecientes);
    renderActividad(data.pedidosRecientes);
  }

  function renderPedidosRecientes(pedidos: DashboardPedidoReciente[] | null): void {
    if (pedidos === null) {
      pedidosRecientesSlot.replaceChildren(
        EmptyState({
          title: 'No se pudo cargar la informacion de pedidos',
          description: 'Intenta recargar la pagina.',
        }),
      );
      return;
    }

    const columns: DataTableColumn<DashboardPedidoReciente>[] = [
      { key: 'codigoPedido', header: 'Codigo' },
      { key: 'clienteNombre', header: 'Cliente' },
      { key: 'tiendaNombre', header: 'Tienda' },
      {
        key: 'estado',
        header: 'Estado',
        render: (row) =>
          Badge({
            label: ESTADO_PEDIDO_LABEL[row.estado],
            variant: ESTADO_PEDIDO_BADGE_VARIANT[row.estado],
          }),
      },
      {
        key: 'creadoEn',
        header: 'Fecha',
        render: (row) => dayjs(row.creadoEn).format('DD/MM/YYYY HH:mm'),
      },
    ];

    pedidosRecientesSlot.replaceChildren(
      DataTable({
        columns,
        rows: pedidos,
        getRowKey: (row) => row.id,
        emptyTitle: 'Sin pedidos registrados',
        emptyDescription: 'Los pedidos que se registren apareceran aqui.',
      }),
    );
  }

  function renderActividad(pedidos: DashboardPedidoReciente[] | null): void {
    if (pedidos === null) {
      actividadSlot.replaceChildren(
        EmptyState({
          title: 'No se pudo cargar la actividad',
          description: 'Intenta recargar la pagina.',
        }),
      );
      return;
    }

    if (pedidos.length === 0) {
      actividadSlot.replaceChildren(
        EmptyState({
          title: 'Sin actividad reciente',
          description: 'Todavia no hay pedidos registrados.',
        }),
      );
      return;
    }

    actividadSlot.replaceChildren(
      el(
        'ul',
        { className: 'flex flex-col divide-y divide-border-default' },
        ...pedidos.map((pedido) =>
          el(
            'li',
            { className: 'flex items-start gap-3 py-3' },
            el(
              'span',
              { className: 'rounded-full bg-surface-muted p-2 text-text-secondary' },
              Icon({ icon: PackagePlus, size: 16 }),
            ),
            el(
              'div',
              { className: 'flex flex-col' },
              el(
                'span',
                { className: 'text-sm text-text-primary' },
                `Pedido ${pedido.codigoPedido} registrado — ${ESTADO_PEDIDO_LABEL[pedido.estado]}`,
              ),
              el(
                'span',
                { className: 'text-xs text-text-muted' },
                formatearFechaRelativa(pedido.creadoEn),
              ),
            ),
          ),
        ),
      ),
    );
  }

  return container;
}

function buildLoadingKpis(): HTMLElement {
  return el(
    'div',
    { className: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4' },
    ...KPI_CONFIG.map((cfg) =>
      StatCard({ label: cfg.label, value: '—', icon: cfg.icon, loading: true }),
    ),
  );
}

function renderKpis(kpis: DashboardKpis): HTMLElement {
  return el(
    'div',
    { className: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4' },
    ...KPI_CONFIG.map((cfg) => {
      const value = kpis[cfg.key];
      return StatCard({
        label: cfg.label,
        value: value === null ? '—' : value,
        icon: cfg.icon,
        variant: value === null ? 'danger' : cfg.variant,
        description: value === null ? 'No se pudo obtener' : undefined,
      });
    }),
  );
}
