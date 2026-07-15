import { History, LayoutDashboard, Package, User } from 'lucide';
import { Footer } from '../../components/footer/footer';
import { Navbar, type NavbarHandle } from '../../components/navbar/navbar';
import { Sidebar, type SidebarNavItem } from '../../components/sidebar/sidebar';
import { env } from '../../config/env';
import { SessionService } from '../../services/session.service';
import { el } from '../../utils/dom';
import { logout } from '../../utils/logout';
import { nombreCompleto } from '../../utils/nombre-completo';
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
  const sidebar = Sidebar({
    items: RIDER_NAV_ITEMS,
    currentPath: window.location.pathname,
    storageKey: 'haku-sidebar-collapsed-rider',
  });
  const navbar = Navbar({
    appName: env.appName,
    userName: currentUser ? nombreCompleto(currentUser) : 'Motorizado',
    profileHref: '/rider/perfil',
    onLogout: logout,
    onMenuClick: () => sidebar.toggleDrawer(),
  });

  const mount = el('main', {
    className:
      'p-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:p-6',
  });

  // Unico contenedor con scroll de todo el panel (Bugfix, 2026-07-14):
  // Navbar y Sidebar quedan fuera de este arbol y nunca se desplazan. El
  // Footer vive dentro de esta misma area (despues de `mount`) para seguir
  // perteneciendo al contenido y aparecer solo al llegar al final del
  // scroll, en vez de quedar fijo en la pantalla.
  const scrollArea = el(
    'div',
    { className: 'min-h-0 flex-1 overflow-y-auto' },
    mount,
    Footer({ appName: env.appName }),
  );

  const content = el(
    'div',
    { className: 'flex h-screen min-h-0 flex-1 flex-col' },
    navbar.element,
    scrollArea,
  );

  const element = el(
    'div',
    { className: 'flex h-screen bg-surface-muted' },
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
