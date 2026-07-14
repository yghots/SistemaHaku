import '@styles/index.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import '@config/dayjs';

import { AdminLayout } from '@layouts/admin/admin-layout';
import { AuthLayout } from '@layouts/auth/auth-layout';
import { RiderLayout } from '@layouts/rider/rider-layout';
import { ClientesPage } from '@pages/admin/clientes/clientes.page';
import { DashboardPage } from '@pages/admin/dashboard/dashboard.page';
import { IncidentesPage } from '@pages/admin/incidentes/incidentes.page';
import { MotorizadosPage } from '@pages/admin/motorizados/motorizados.page';
import { PedidosPage } from '@pages/admin/pedidos/pedidos.page';
import { ReporteEntregasPage } from '@pages/admin/reportes/reporte-entregas.page';
import { ReporteMotorizadosPage } from '@pages/admin/reportes/reporte-motorizados.page';
import { ReportePedidosPage } from '@pages/admin/reportes/reporte-pedidos.page';
import { SucursalesPage } from '@pages/admin/sucursales/sucursales.page';
import { TiendasPage } from '@pages/admin/tiendas/tiendas.page';
import { UsuariosPage } from '@pages/admin/usuarios/usuarios.page';
import { LoginPage } from '@pages/auth/login.page';
import { PlaceholderPage } from '@pages/placeholder-page';
import { ProfilePage } from '@pages/profile/profile.page';
import { HistorialPage } from '@pages/rider/historial/historial.page';
import { MisPedidosPage } from '@pages/rider/mis-pedidos/mis-pedidos.page';
import { DEFAULT_PATH_BY_ROLE } from '@constants/roles';
import { Router, type RouteBreadcrumbItem } from '@router/router';
import { withAuth } from '@router/route-guard';
import { SessionService } from '@services/session.service';
import { initTheme } from '@utils/theme';

// Debe ejecutarse antes de renderizar nada, para evitar un parpadeo del tema.
initTheme();

const appRoot = document.getElementById('app');
if (!appRoot) {
  throw new Error('No se encontro el elemento #app en index.html');
}

bootstrap();

/**
 * Punto de entrada unico de la app. Decide, en base a SessionService y al
 * path actual, si mostrar Login o el panel que corresponde al rol de la
 * sesion activa. No hay JWT: la proteccion depende exclusivamente de
 * SessionService (ver limitacion documentada en FRONTEND_PROGRESS.md,
 * Fase 3).
 */
function bootstrap(): void {
  const path = window.location.pathname;
  const user = SessionService.getCurrentUser();

  if (path === '/login') {
    if (user) {
      window.location.href = DEFAULT_PATH_BY_ROLE[user.rol];
      return;
    }
    mountLogin();
    return;
  }

  if (!user) {
    window.location.href = '/login';
    return;
  }

  if (user.rol === 'motorizado') {
    if (path.startsWith('/admin')) {
      window.location.href = DEFAULT_PATH_BY_ROLE.motorizado;
      return;
    }
    mountRiderPanel();
    return;
  }

  if (path.startsWith('/rider')) {
    window.location.href = DEFAULT_PATH_BY_ROLE.administrador;
    return;
  }
  mountAdminPanel();
}

function mountLogin(): void {
  const layout = AuthLayout();
  appRoot!.appendChild(layout.element);
  layout.mount.appendChild(LoginPage());
}

function mountAdminPanel(): void {
  redirectRootTo('/admin/dashboard');

  const layout = AdminLayout();
  appRoot!.appendChild(layout.element);

  const router = new Router(layout.mount);

  router.register(
    '/admin/dashboard',
    withAuth((container) => {
      container.appendChild(DashboardPage());
    }),
    {
      title: 'Dashboard',
      breadcrumb: [{ label: 'Dashboard' }],
    },
  );

  router.register(
    '/admin/usuarios',
    withAuth((container) => {
      container.appendChild(UsuariosPage());
    }),
    {
      title: 'Usuarios',
      breadcrumb: [{ label: 'Usuarios' }],
    },
  );

  router.register(
    '/admin/tiendas',
    withAuth((container) => {
      container.appendChild(TiendasPage());
    }),
    {
      title: 'Tiendas',
      breadcrumb: [{ label: 'Tiendas' }],
    },
  );

  router.register(
    '/admin/sucursales',
    withAuth((container) => {
      container.appendChild(SucursalesPage());
    }),
    {
      title: 'Sucursales',
      breadcrumb: [{ label: 'Sucursales' }],
    },
  );

  router.register(
    '/admin/clientes',
    withAuth((container) => {
      container.appendChild(ClientesPage());
    }),
    {
      title: 'Clientes',
      breadcrumb: [{ label: 'Clientes' }],
    },
  );

  router.register(
    '/admin/motorizados',
    withAuth((container) => {
      container.appendChild(MotorizadosPage());
    }),
    {
      title: 'Motorizados',
      breadcrumb: [{ label: 'Motorizados' }],
    },
  );

  router.register(
    '/admin/pedidos',
    withAuth((container) => {
      container.appendChild(PedidosPage());
    }),
    {
      title: 'Pedidos',
      breadcrumb: [{ label: 'Pedidos' }],
    },
  );

  router.register(
    '/admin/incidentes',
    withAuth((container) => {
      container.appendChild(IncidentesPage());
    }),
    {
      title: 'Incidentes',
      breadcrumb: [{ label: 'Incidentes' }],
    },
  );

  router.register(
    '/admin/reportes/pedidos',
    withAuth((container) => {
      container.appendChild(ReportePedidosPage());
    }),
    {
      title: 'Reporte de Pedidos',
      breadcrumb: [{ label: 'Reportes' }, { label: 'Pedidos' }],
    },
  );

  router.register(
    '/admin/reportes/entregas',
    withAuth((container) => {
      container.appendChild(ReporteEntregasPage());
    }),
    {
      title: 'Reporte de Entregas',
      breadcrumb: [{ label: 'Reportes' }, { label: 'Entregas' }],
    },
  );

  router.register(
    '/admin/reportes/motorizados',
    withAuth((container) => {
      container.appendChild(ReporteMotorizadosPage());
    }),
    {
      title: 'Reporte de Productividad',
      breadcrumb: [{ label: 'Reportes' }, { label: 'Productividad' }],
    },
  );

  router.register(
    '/admin/perfil',
    withAuth((container) => {
      container.appendChild(ProfilePage());
    }),
    {
      title: 'Mi Perfil',
      breadcrumb: [{ label: 'Mi Perfil' }],
    },
  );

  wireRouteChange(router, layout);
  router.start();
}

function mountRiderPanel(): void {
  redirectRootTo('/rider/dashboard');

  const layout = RiderLayout();
  appRoot!.appendChild(layout.element);

  const router = new Router(layout.mount);

  registerPlaceholder(router, '/rider/dashboard', 'Dashboard');

  router.register(
    '/rider/mis-pedidos',
    withAuth((container) => {
      container.appendChild(MisPedidosPage());
    }),
    {
      title: 'Mis pedidos',
      breadcrumb: [{ label: 'Mis pedidos' }],
    },
  );

  router.register(
    '/rider/historial',
    withAuth((container) => {
      container.appendChild(HistorialPage());
    }),
    {
      title: 'Historial',
      breadcrumb: [{ label: 'Historial' }],
    },
  );

  router.register(
    '/rider/perfil',
    withAuth((container) => {
      container.appendChild(ProfilePage());
    }),
    {
      title: 'Mi Perfil',
      breadcrumb: [{ label: 'Mi Perfil' }],
    },
  );

  wireRouteChange(router, layout);
  router.start();
}

/** Reemplaza el path '/' por el path por defecto del panel ANTES de que el router arranque, para no navegar durante un render. */
function redirectRootTo(defaultPath: string): void {
  if (window.location.pathname === '/') {
    window.history.replaceState({}, '', defaultPath);
  }
}

function registerPlaceholder(router: Router, path: string, title: string): void {
  const breadcrumb: RouteBreadcrumbItem[] = [{ label: title }];
  router.register(
    path,
    withAuth((container) => {
      container.appendChild(PlaceholderPage(title, breadcrumb));
    }),
    { title, breadcrumb },
  );
}

interface RoutableLayout {
  navbar: { setBreadcrumb: (items: RouteBreadcrumbItem[]) => void };
  setActivePath: (path: string) => void;
}

function wireRouteChange(router: Router, layout: RoutableLayout): void {
  router.onRouteChange((path, meta) => {
    document.title = meta ? `${meta.title} · HAKU Courier` : 'HAKU Courier';
    layout.navbar.setBreadcrumb(meta?.breadcrumb ?? (meta ? [{ label: meta.title }] : []));
    layout.setActivePath(path);
  });
}
