import dayjs from 'dayjs';
import {
  AlertTriangle,
  Clock,
  History,
  Navigation,
  Package,
  PackageCheck,
  type IconNode,
} from 'lucide';
import { Badge } from '../../../components/badge/badge';
import { BUTTON_VARIANT_CLASSES } from '../../../components/button/button';
import { Card } from '../../../components/card/card';
import { DataTable, type DataTableColumn } from '../../../components/datatable/datatable';
import { EmptyState } from '../../../components/empty-state/empty-state';
import { Icon } from '../../../components/icon/icon';
import { Loader } from '../../../components/loader/loader';
import { PageHeader } from '../../../components/page-header/page-header';
import { Section } from '../../../components/section/section';
import { StatCard, type StatCardVariant } from '../../../components/stat-card/stat-card';
import { ESTADO_PEDIDO_BADGE_VARIANT, ESTADO_PEDIDO_LABEL } from '../../../constants/estado-pedido';
import { RiderDashboardService } from '../../../services/rider-dashboard.service';
import type {
  RiderDashboardData,
  RiderDashboardKpis,
  RiderProximoPedido,
} from '../../../types/rider-dashboard';
import type { ReportePedidoItem } from '../../../types/reporte';
import { cn } from '../../../utils/cn';
import { el } from '../../../utils/dom';

interface KpiConfig {
  key: keyof RiderDashboardKpis;
  label: string;
  icon: IconNode;
  variant: StatCardVariant;
}

const KPI_CONFIG: KpiConfig[] = [
  { key: 'pedidosPendientes', label: 'Pedidos pendientes', icon: Clock, variant: 'neutral' },
  { key: 'pedidosEnRuta', label: 'Pedidos en ruta', icon: Navigation, variant: 'warning' },
  {
    key: 'pedidosEntregadosHoy',
    label: 'Entregados hoy',
    icon: PackageCheck,
    variant: 'success',
  },
  { key: 'pedidosAtendidosHoy', label: 'Atendidos hoy', icon: Package, variant: 'brand' },
  {
    key: 'incidentesRegistrados',
    label: 'Incidentes registrados',
    icon: AlertTriangle,
    variant: 'info',
  },
];

const QUICK_ACCESS_ITEMS: Array<{ label: string; href: string; icon: IconNode }> = [
  { label: 'Ver Mis Pedidos', href: '/rider/mis-pedidos', icon: Package },
  { label: 'Ver Historial', href: '/rider/historial', icon: History },
  { label: 'Registrar Incidente', href: '/rider/mis-pedidos', icon: AlertTriangle },
];

/**
 * Dashboard del Motorizado (Fase 12): pantalla operativa orientada al
 * trabajo diario del repartidor — sin indicadores administrativos ni de
 * negocio. Implementacion completamente distinta del Dashboard del
 * Administrador (Fase 10): mismo patron de fachada (`*DashboardService`),
 * pero datos y widgets propios. Solo se comunica con
 * `RiderDashboardService` — nunca con `PedidosService`, `IncidentesService`,
 * `MotorizadosService` ni `SessionService` directamente.
 */
export function RiderDashboardPage(): HTMLElement {
  const contentSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando dashboard' }),
  );

  const container = el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Dashboard',
      description: 'Resumen de tu actividad diaria.',
      breadcrumb: [{ label: 'Dashboard' }],
    }),
    contentSlot,
  );

  void init();

  async function init(): Promise<void> {
    const data = await RiderDashboardService.obtenerDashboard();
    if (!data.tienePerfil) {
      contentSlot.replaceChildren(
        EmptyState({
          icon: AlertTriangle,
          title: 'No tienes un perfil operativo',
          description: 'Contacta a un administrador para que te asigne un perfil de motorizado.',
        }),
      );
      return;
    }
    contentSlot.replaceChildren(buildContent(data));
  }

  return container;
}

function buildContent(data: RiderDashboardData): HTMLElement {
  return el(
    'div',
    { className: 'flex flex-col gap-8' },
    buildKpis(data.kpis),
    buildProximoPedido(data.proximoPedido),
    el(
      'div',
      { className: 'grid grid-cols-1 gap-6 xl:grid-cols-3' },
      el(
        'div',
        { className: 'xl:col-span-2' },
        Section({
          title: 'Mis pedidos recientes',
          description: 'Los ultimos pedidos asignados a ti.',
          children: buildPedidosRecientes(data.pedidosRecientes),
        }),
      ),
      Card({ title: 'Actividad reciente', children: buildActividad(data.pedidosRecientes) }),
    ),
    Section({ title: 'Acciones rapidas', children: buildQuickAccess() }),
  );
}

function buildKpis(kpis: RiderDashboardKpis): HTMLElement {
  return el(
    'div',
    { className: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5' },
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

function buildProximoPedido(proximoPedido: RiderProximoPedido | null): HTMLElement {
  if (!proximoPedido) {
    return Card({
      title: 'Mi proximo pedido',
      children: EmptyState({
        icon: Package,
        title: 'No tienes pedidos activos',
        description: 'Los pedidos que te asignen apareceran aqui.',
      }),
    });
  }

  return Card({
    title: 'Mi proximo pedido',
    children: el(
      'div',
      { className: 'flex flex-col gap-4' },
      el(
        'div',
        { className: 'flex flex-wrap items-center justify-between gap-3' },
        el(
          'div',
          { className: 'flex flex-col gap-1' },
          el(
            'span',
            { className: 'text-lg font-semibold text-text-primary' },
            proximoPedido.codigoPedido,
          ),
          el('span', { className: 'text-sm text-text-muted' }, proximoPedido.clienteNombre),
        ),
        Badge({
          label: ESTADO_PEDIDO_LABEL[proximoPedido.estado],
          variant: ESTADO_PEDIDO_BADGE_VARIANT[proximoPedido.estado],
        }),
      ),
      el(
        'div',
        { className: 'grid grid-cols-1 gap-3 sm:grid-cols-2' },
        el(
          'div',
          { className: 'flex flex-col gap-1' },
          el(
            'span',
            { className: 'text-xs font-medium uppercase tracking-wide text-text-muted' },
            'Direccion',
          ),
          el('span', { className: 'text-sm text-text-primary' }, proximoPedido.direccionEntrega),
        ),
        el(
          'div',
          { className: 'flex flex-col gap-1' },
          el(
            'span',
            { className: 'text-xs font-medium uppercase tracking-wide text-text-muted' },
            'Telefono',
          ),
          el(
            'span',
            { className: 'text-sm text-text-primary' },
            proximoPedido.telefonoContacto ?? '—',
          ),
        ),
      ),
    ),
    footer: el(
      'a',
      {
        href: '/rider/mis-pedidos',
        'data-link': 'true',
        className: cn(
          'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          BUTTON_VARIANT_CLASSES.primary,
        ),
      },
      Icon({ icon: Package, size: 16 }),
      'Ir a Mis Pedidos',
    ),
  });
}

function buildPedidosRecientes(pedidos: ReportePedidoItem[] | null): HTMLElement {
  if (pedidos === null) {
    return EmptyState({
      icon: AlertTriangle,
      title: 'No se pudo cargar la informacion de pedidos',
      description: 'Intenta recargar la pagina.',
    });
  }

  const columns: DataTableColumn<ReportePedidoItem>[] = [
    { key: 'codigoPedido', header: 'Codigo' },
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

  return DataTable({
    columns,
    rows: pedidos,
    getRowKey: (row) => row.id,
    emptyTitle: 'Sin pedidos asignados',
    emptyDescription: 'Los pedidos que te asignen apareceran aqui.',
  });
}

function buildActividad(pedidos: ReportePedidoItem[] | null): HTMLElement {
  if (pedidos === null) {
    return EmptyState({
      title: 'No se pudo cargar la actividad',
      description: 'Intenta recargar la pagina.',
    });
  }

  if (pedidos.length === 0) {
    return EmptyState({
      title: 'Sin actividad reciente',
      description: 'Todavia no tienes pedidos asignados.',
    });
  }

  return el(
    'ul',
    { className: 'flex flex-col divide-y divide-border-default' },
    ...pedidos.map((pedido) =>
      el(
        'li',
        { className: 'flex items-start gap-3 py-3' },
        el(
          'span',
          { className: 'rounded-full bg-surface-muted p-2 text-text-secondary' },
          Icon({ icon: Package, size: 16 }),
        ),
        el(
          'div',
          { className: 'flex flex-col' },
          el(
            'span',
            { className: 'text-sm text-text-primary' },
            `Pedido ${pedido.codigoPedido} — ${ESTADO_PEDIDO_LABEL[pedido.estado]}`,
          ),
          el('span', { className: 'text-xs text-text-muted' }, dayjs(pedido.creadoEn).fromNow()),
        ),
      ),
    ),
  );
}

function buildQuickAccess(): HTMLElement {
  return el(
    'div',
    { className: 'grid grid-cols-1 gap-3 sm:grid-cols-3' },
    ...QUICK_ACCESS_ITEMS.map((item) =>
      el(
        'a',
        {
          href: item.href,
          'data-link': 'true',
          className:
            'flex flex-col items-center gap-2 rounded-xl border border-border-default bg-surface-elevated p-4 text-center transition-colors hover:bg-surface-muted',
        },
        el(
          'span',
          {
            className:
              'rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
          },
          Icon({ icon: item.icon, size: 18 }),
        ),
        el('span', { className: 'text-sm font-medium text-text-primary' }, item.label),
      ),
    ),
  );
}
