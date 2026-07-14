import {
  AlertTriangle,
  Bike,
  Building2,
  ClipboardList,
  LayoutDashboard,
  PackageCheck,
  Store,
  TrendingUp,
  Truck,
  User,
  Users,
  UsersRound,
} from 'lucide';
import { Footer } from '../../components/footer/footer';
import { Navbar, type NavbarHandle } from '../../components/navbar/navbar';
import { Sidebar, type SidebarNavItem } from '../../components/sidebar/sidebar';
import { env } from '../../config/env';
import { SessionService } from '../../services/session.service';
import { el } from '../../utils/dom';
import { logout } from '../../utils/logout';
import { nombreCompleto } from '../../utils/nombre-completo';
import type { LayoutHandle } from '../layout.types';

const ADMIN_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { label: 'Tiendas', href: '/admin/tiendas', icon: Store },
  { label: 'Sucursales', href: '/admin/sucursales', icon: Building2 },
  { label: 'Clientes', href: '/admin/clientes', icon: UsersRound },
  { label: 'Motorizados', href: '/admin/motorizados', icon: Bike },
  { label: 'Pedidos', href: '/admin/pedidos', icon: Truck },
  { label: 'Incidentes', href: '/admin/incidentes', icon: AlertTriangle },
  { label: 'Reporte de Pedidos', href: '/admin/reportes/pedidos', icon: ClipboardList },
  { label: 'Reporte de Entregas', href: '/admin/reportes/entregas', icon: PackageCheck },
  { label: 'Reporte de Productividad', href: '/admin/reportes/motorizados', icon: TrendingUp },
  { label: 'Mi Perfil', href: '/admin/perfil', icon: User },
];

export interface AdminLayoutHandle extends LayoutHandle {
  navbar: NavbarHandle;
  setActivePath: (path: string) => void;
}

/** Layout del panel Administrativo: Navbar + Sidebar + area principal + Footer. */
export function AdminLayout(): AdminLayoutHandle {
  const currentUser = SessionService.getCurrentUser();
  const sidebar = Sidebar({
    items: ADMIN_NAV_ITEMS,
    currentPath: window.location.pathname,
    storageKey: 'haku-sidebar-collapsed-admin',
  });
  const navbar = Navbar({
    appName: env.appName,
    userName: currentUser ? nombreCompleto(currentUser) : 'Administrador',
    profileHref: '/admin/perfil',
    onLogout: logout,
    onMenuClick: () => sidebar.toggleDrawer(),
  });

  const mount = el('main', {
    className:
      'flex-1 overflow-y-auto p-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:p-6',
  });

  const content = el(
    'div',
    { className: 'flex min-h-screen flex-1 flex-col' },
    navbar.element,
    mount,
    Footer({ appName: env.appName }),
  );

  const element = el(
    'div',
    { className: 'flex min-h-screen bg-surface-muted' },
    sidebar.element,
    content,
  );

  return {
    element,
    mount,
    navbar,
    setActivePath: sidebar.setActivePath,
  };
}
