import { PanelLeftClose, PanelLeftOpen, type IconNode } from 'lucide';
import { Icon } from '../icon/icon';
import { Tooltip } from '../tooltip/tooltip';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: IconNode;
}

export interface SidebarProps {
  items: SidebarNavItem[];
  /** Ruta activa inicial, para resaltar el item correspondiente. */
  currentPath: string;
  /** Clave de localStorage para persistir el colapso (distinta entre Admin y Rider, por si acaso). */
  storageKey?: string;
}

export interface SidebarHandle {
  /** `<lg`: aside + backdrop, ambos con `display: contents` en el wrapper (no participan del flujo flex). `>=lg`: solo el aside participa (backdrop siempre oculto via `lg:hidden`). */
  element: HTMLElement;
  setActivePath: (path: string) => void;
  /** Abre el Drawer (solo tiene efecto visual por debajo del breakpoint `lg`). */
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const DEFAULT_STORAGE_KEY = 'haku-sidebar-collapsed';
const DRAWER_CLOSE_ANIMATION_MS = 200;

function readCollapsedState(storageKey: string): boolean {
  return localStorage.getItem(storageKey) === 'true';
}

/**
 * Navegacion lateral generica y reutilizable (Admin y Rider comparten este
 * mismo componente, cada uno con su propio arreglo de `items`). En Desktop
 * (`lg` y superior) es la barra colapsable de siempre (Fase 2). Por debajo
 * de `lg` el MISMO componente se comporta como un Drawer (Fase 13): oculto
 * por defecto, se desliza desde la izquierda sobre un backdrop al invocar
 * `openDrawer` (disparado por el boton hamburguesa de Navbar), y se cierra
 * al elegir una opcion, tocar el backdrop o presionar Escape. No existen
 * dos componentes (uno para Desktop y otro para mobile): un unico arbol
 * de nodos cuyo comportamiento cambia por CSS (breakpoint `lg`) y por el
 * estado `isDrawerOpen` (clases de transform), sin duplicar logica de
 * navegacion.
 */
export function Sidebar(props: SidebarProps): SidebarHandle {
  const storageKey = props.storageKey ?? DEFAULT_STORAGE_KEY;
  let collapsed = readCollapsedState(storageKey);
  let isDrawerOpen = false;
  let drawerCloseTimeout: number | undefined;

  const linkLabels: HTMLSpanElement[] = [];
  const linkElements: HTMLAnchorElement[] = [];

  function isActive(href: string): boolean {
    return href === '/' ? props.currentPath === '/' : props.currentPath.startsWith(href);
  }

  function linkClasses(active: boolean): string {
    return cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      active
        ? 'bg-soft-brand-bg text-soft-brand-fg'
        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
    );
  }

  const navLinks = props.items.map((item) => {
    const label = el('span', { className: 'truncate transition-opacity duration-150' }, item.label);
    linkLabels.push(label);

    const link = el(
      'a',
      {
        href: item.href,
        'data-link': 'true',
        className: linkClasses(isActive(item.href)),
      },
      Icon({ icon: item.icon, size: 18 }),
      label,
    );
    link.addEventListener('click', () => closeDrawer());
    linkElements.push(link);

    // Siempre envuelto en Tooltip: cuando esta colapsado (solo posible en
    // Desktop) es la unica forma de ver la etiqueta; en el Drawer (mobile)
    // las etiquetas siempre son visibles y el Tooltip nunca se dispara
    // (no hay hover tactil), asi que es simplemente redundante — no molesta.
    return Tooltip({ content: item.label, position: 'right', className: 'w-full', children: link });
  });

  const nav = el(
    'nav',
    { className: 'flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4' },
    ...navLinks,
  );

  const collapseButton = el(
    'button',
    {
      type: 'button',
      className:
        'hidden items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary lg:flex',
      'aria-label': collapsed ? 'Expandir menu' : 'Colapsar menu',
    },
    Icon({ icon: collapsed ? PanelLeftOpen : PanelLeftClose, size: 18 }),
    el('span', { className: 'truncate' }, collapsed ? '' : 'Colapsar'),
  );

  const closeDrawerButton = el(
    'button',
    {
      type: 'button',
      className:
        'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary lg:hidden',
      'aria-label': 'Cerrar menu',
    },
    Icon({ icon: PanelLeftClose, size: 20 }),
  );
  closeDrawerButton.addEventListener('click', () => closeDrawer());

  const drawerHeader = el(
    'div',
    { className: 'flex shrink-0 items-center justify-end px-3 py-3 lg:hidden' },
    closeDrawerButton,
  );

  const asideElement = el(
    'aside',
    {
      className: cn(
        // Mobile (< lg): Drawer fijo, oculto fuera de pantalla por defecto.
        'fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r border-border-default bg-surface-sidebar transition-transform duration-200 ease-out',
        'pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]',
        // Desktop (>= lg): vuelve a ser la barra estatica colapsable de siempre.
        'lg:static lg:inset-auto lg:z-auto lg:translate-x-0 lg:pb-0 lg:pl-0 lg:transition-[width] lg:duration-200 lg:ease-out',
        collapsed ? 'lg:w-[76px]' : 'lg:w-64',
      ),
    },
    drawerHeader,
    nav,
    el('div', { className: 'border-t border-border-default px-3 py-3' }, collapseButton),
  );

  const backdrop = el('div', {
    className: cn(
      'fixed inset-0 z-40 hidden bg-overlay-scrim opacity-0 transition-opacity duration-200 ease-out lg:hidden',
    ),
  });
  backdrop.addEventListener('click', () => closeDrawer());

  // `display: contents`: el wrapper no participa del layout flex de
  // AdminLayout/RiderLayout (que solo esperan un unico `element` como hijo
  // directo) — aside y backdrop se comportan como si fueran hijos directos
  // de ese contenedor. aside es `position: fixed` en mobile y `static` en
  // Desktop; backdrop es siempre `position: fixed` (o `lg:hidden`), asi que
  // ninguno de los dos ocupa espacio real en el flujo salvo el propio aside
  // en Desktop (que sigue siendo el unico participante del flex, igual que
  // antes de esta fase).
  const element = el('div', { className: 'contents' }, backdrop, asideElement);

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') closeDrawer();
  }

  function openDrawer(): void {
    if (isDrawerOpen) return;
    isDrawerOpen = true;
    window.clearTimeout(drawerCloseTimeout);

    backdrop.classList.remove('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        asideElement.classList.remove('-translate-x-full');
      });
    });

    document.body.classList.add('overflow-hidden');
    document.addEventListener('keydown', handleKeydown);
  }

  function closeDrawer(): void {
    if (!isDrawerOpen) return;
    isDrawerOpen = false;

    backdrop.classList.add('opacity-0');
    asideElement.classList.add('-translate-x-full');
    document.body.classList.remove('overflow-hidden');
    document.removeEventListener('keydown', handleKeydown);

    drawerCloseTimeout = window.setTimeout(() => {
      backdrop.classList.add('hidden');
    }, DRAWER_CLOSE_ANIMATION_MS);
  }

  function toggleDrawer(): void {
    if (isDrawerOpen) closeDrawer();
    else openDrawer();
  }

  collapseButton.addEventListener('click', () => {
    collapsed = !collapsed;
    localStorage.setItem(storageKey, String(collapsed));
    asideElement.classList.toggle('lg:w-64', !collapsed);
    asideElement.classList.toggle('lg:w-[76px]', collapsed);
    // `lg:hidden` (no `hidden` a secas): el colapso es un estado exclusivo
    // de Desktop. En el Drawer (< lg) las etiquetas deben verse siempre,
    // sin importar el valor persistido de `collapsed`.
    for (const label of linkLabels) {
      label.classList.toggle('lg:hidden', collapsed);
    }
    collapseButton.setAttribute('aria-label', collapsed ? 'Expandir menu' : 'Colapsar menu');
    const collapseLabel = collapseButton.lastElementChild;
    if (collapseLabel) collapseLabel.textContent = collapsed ? '' : 'Colapsar';
    // El tooltip solo tiene sentido cuando esta colapsado; alternar visibilidad
    // completa requeriria reconstruir los links, asi que se opta por lo mas
    // simple (KISS): las etiquetas ya se ocultan/muestran arriba.
  });

  if (collapsed) {
    for (const label of linkLabels) label.classList.add('lg:hidden');
  }

  function setActivePath(path: string): void {
    props.currentPath = path;
    linkElements.forEach((link, index) => {
      const item = props.items[index];
      if (!item) return;
      link.className = linkClasses(isActive(item.href));
    });
  }

  return { element, setActivePath, openDrawer, closeDrawer, toggleDrawer };
}
