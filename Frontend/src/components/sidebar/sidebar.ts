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
  element: HTMLElement;
  setActivePath: (path: string) => void;
}

const DEFAULT_STORAGE_KEY = 'haku-sidebar-collapsed';

function readCollapsedState(storageKey: string): boolean {
  return localStorage.getItem(storageKey) === 'true';
}

/**
 * Navegacion lateral generica y reutilizable (Admin y Rider comparten este
 * mismo componente, cada uno con su propio arreglo de `items`). Colapsable,
 * con transicion de ancho animada y estado persistido en localStorage.
 */
export function Sidebar(props: SidebarProps): SidebarHandle {
  const storageKey = props.storageKey ?? DEFAULT_STORAGE_KEY;
  let collapsed = readCollapsedState(storageKey);

  const linkLabels: HTMLSpanElement[] = [];
  const linkElements: HTMLAnchorElement[] = [];

  function isActive(href: string): boolean {
    return href === '/' ? props.currentPath === '/' : props.currentPath.startsWith(href);
  }

  function linkClasses(active: boolean): string {
    return cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      active
        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
        : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
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
    linkElements.push(link);

    // Siempre envuelto en Tooltip: cuando esta colapsado es la unica forma de
    // ver la etiqueta; cuando esta expandido es simplemente redundante con el
    // texto visible (no molesta).
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
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary',
      'aria-label': collapsed ? 'Expandir menu' : 'Colapsar menu',
    },
    Icon({ icon: collapsed ? PanelLeftOpen : PanelLeftClose, size: 18 }),
    el('span', { className: 'truncate' }, collapsed ? '' : 'Colapsar'),
  );

  const element = el(
    'aside',
    {
      className: cn(
        'hidden shrink-0 flex-col border-r border-border-default bg-surface-elevated transition-all duration-200 ease-out lg:flex',
        collapsed ? 'w-[76px]' : 'w-64',
      ),
    },
    nav,
    el('div', { className: 'border-t border-border-default px-3 py-3' }, collapseButton),
  );

  collapseButton.addEventListener('click', () => {
    collapsed = !collapsed;
    localStorage.setItem(storageKey, String(collapsed));
    element.classList.toggle('w-64', !collapsed);
    element.classList.toggle('w-[76px]', collapsed);
    for (const label of linkLabels) {
      label.classList.toggle('hidden', collapsed);
    }
    collapseButton.setAttribute('aria-label', collapsed ? 'Expandir menu' : 'Colapsar menu');
    const collapseLabel = collapseButton.lastElementChild;
    if (collapseLabel) collapseLabel.textContent = collapsed ? '' : 'Colapsar';
    // El tooltip solo tiene sentido cuando esta colapsado; alternar visibilidad
    // completa requeriria reconstruir los links, asi que se opta por lo mas
    // simple (KISS): las etiquetas ya se ocultan/muestran arriba.
  });

  if (collapsed) {
    for (const label of linkLabels) label.classList.add('hidden');
  }

  function setActivePath(path: string): void {
    props.currentPath = path;
    linkElements.forEach((link, index) => {
      const item = props.items[index];
      if (!item) return;
      link.className = linkClasses(isActive(item.href));
    });
  }

  return { element, setActivePath };
}
