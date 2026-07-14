import { History, LayoutDashboard, Package, User } from 'lucide';
import { Footer } from '../../components/footer/footer';
import { Navbar, type NavbarHandle } from '../../components/navbar/navbar';
import { Sidebar, type SidebarNavItem } from '../../components/sidebar/sidebar';
import { env } from '../../config/env';
import { SessionService } from '../../services/session.service';
import { el } from '../../utils/dom';
import { logout } from '../../utils/logout';
import type { LayoutHandle } from '../layout.types';

const RIDER_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/rider/dashboard', icon: LayoutDashboard },
  { label: 'Mis pedidos', href: '/rider/mis-pedidos', icon: Package },
  { label: 'Historial', href: '/rider/historial', icon: History },
  { label: 'Mi Perfil', href: '/rider/perfil', icon: User },
];

export interface RiderLayoutHandle extends LayoutHandle {
  navbar: NavbarHandle;
  setActivePath: (path: string) => void;
}

/** Layout del panel del Motorizado: Navbar + Sidebar + area principal + Footer (mismos componentes que AdminLayout, distinta navegacion). */
export function RiderLayout(): RiderLayoutHandle {
  const currentUser = SessionService.getCurrentUser();
  const navbar = Navbar({
    appName: env.appName,
    userName: currentUser?.usuario ?? 'Motorizado',
    profileHref: '/rider/perfil',
    onLogout: logout,
  });
  const sidebar = Sidebar({
    items: RIDER_NAV_ITEMS,
    currentPath: window.location.pathname,
    storageKey: 'haku-sidebar-collapsed-rider',
  });

  const mount = el('main', { className: 'flex-1 overflow-y-auto p-4 sm:p-6' });

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
