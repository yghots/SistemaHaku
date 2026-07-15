import { Bell, Gem, LogOut, Menu, Moon, Sun, User, type IconNode } from 'lucide';
import { Avatar } from '../avatar/avatar';
import { Breadcrumb, type BreadcrumbItem } from '../breadcrumb/breadcrumb';
import { Icon } from '../icon/icon';
import { IconButton } from '../button/icon-button';
import { Dropdown } from '../dropdown/dropdown';
import { SearchBar } from '../searchbar/searchbar';
import { getTheme, onThemeChange, toggleTheme, type Theme } from '../../utils/theme';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

/** Icono del boton de tema por tema activo (Fase 21: Gem para Midnight, distinto de la Luna de Dark). Reutilizado por Navbar y AuthLayout — unica fuente del mapeo. */
export const THEME_TOGGLE_ICON: Record<Theme, IconNode> = {
  light: Sun,
  dark: Moon,
  midnight: Gem,
};

export interface NavbarProps {
  appName: string;
  /** Nombre a mostrar en el menu de usuario. */
  userName: string;
  /** Ruta de "Mi perfil" (distinta por panel: /admin/perfil o /rider/perfil). Navega via SPA (data-link), igual que cualquier otro item del menu que enlaza a una pagina. */
  profileHref: string;
  /** Se invoca al elegir "Cerrar sesion" en el menu de usuario. Navbar no conoce SessionService: quien lo construye decide que hacer. */
  onLogout?: () => void;
  /** Se invoca al tocar el boton hamburguesa (solo visible por debajo de `lg`). Si se omite, no se renderiza el boton — asi AuthLayout (sin Sidebar) puede seguir usando este mismo Navbar sin cambios. */
  onMenuClick?: () => void;
  className?: string;
}

export interface NavbarHandle {
  element: HTMLElement;
  setBreadcrumb: (items: BreadcrumbItem[]) => void;
}

/**
 * Barra superior generica, compartida por AdminLayout y RiderLayout.
 * Busqueda y notificaciones siguen siendo solo interfaz (sin funcionalidad
 * conectada). El menu de usuario tiene "Cerrar sesion" (Fase 3) y
 * "Mi perfil" (Fase 11, navega a `profileHref`) conectados.
 */
export function Navbar(props: NavbarProps): NavbarHandle {
  const menuButton = props.onMenuClick
    ? IconButton({
        icon: Menu,
        label: 'Abrir menu',
        variant: 'ghost',
        className: 'lg:hidden',
        onClick: () => props.onMenuClick?.(),
      })
    : null;

  const logo = el(
    'a',
    {
      href: '/',
      'data-link': 'true',
      className: 'shrink-0 truncate text-base font-semibold text-text-primary',
    },
    props.appName,
  );

  const breadcrumbSlot = el('div', { className: 'hidden md:block' });

  const searchBar = SearchBar({
    placeholder: 'Buscar...',
    className: 'hidden w-full max-w-xs sm:block',
  });

  const themeToggle = IconButton({
    icon: THEME_TOGGLE_ICON[getTheme()],
    label: 'Cambiar tema',
    onClick: () => toggleTheme(),
  });
  onThemeChange((theme) => {
    const newIcon = Icon({ icon: THEME_TOGGLE_ICON[theme], size: 18 });
    themeToggle.firstElementChild?.replaceWith(newIcon);
  });

  const notificationsButton = el(
    'div',
    { className: 'relative' },
    IconButton({ icon: Bell, label: 'Notificaciones (proximamente)' }),
    el('span', { className: 'absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500' }),
  );

  const userTrigger = el(
    'button',
    {
      type: 'button',
      className: 'rounded-full transition-opacity hover:opacity-80',
      'aria-label': `Cuenta de ${props.userName}`,
    },
    Avatar({ name: props.userName, size: 'sm' }),
  );

  const userDropdown = Dropdown({
    trigger: userTrigger,
    items: [
      { label: 'Mi perfil', icon: User, href: props.profileHref },
      { label: 'Cerrar sesion', icon: LogOut, danger: true, onSelect: () => props.onLogout?.() },
    ],
  });

  const element = el(
    'header',
    {
      className: cn(
        'flex min-h-16 shrink-0 items-center gap-2 border-b border-border-default bg-surface-navbar px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] sm:gap-4 sm:px-6',
        props.className,
      ),
    },
    menuButton,
    logo,
    breadcrumbSlot,
    el('div', { className: 'flex-1' }, searchBar.wrapper),
    el(
      'div',
      { className: 'flex items-center gap-2' },
      themeToggle,
      notificationsButton,
      userDropdown.wrapper,
    ),
  );

  function setBreadcrumb(items: BreadcrumbItem[]): void {
    breadcrumbSlot.replaceChildren(Breadcrumb({ items }));
  }

  return { element, setBreadcrumb };
}
