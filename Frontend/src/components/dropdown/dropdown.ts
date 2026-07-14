import type { IconNode } from 'lucide';
import { Icon } from '../icon/icon';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';
import { computeFloatingPosition } from '../../utils/floating-position';
import { focusFirstElement, restoreFocus, trapTabKey } from '../../utils/focus-trap';

export interface DropdownItem {
  label: string;
  icon?: IconNode;
  onSelect?: () => void;
  /** Alternativa a `onSelect`: navega via el router SPA (data-link) en vez de ejecutar una accion. */
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}

export type DropdownAlign = 'left' | 'right';

export interface DropdownProps {
  /** Elemento que abre/cierra el menu al hacer click (ej. un IconButton o un Avatar). */
  trigger: HTMLElement;
  items: DropdownItem[];
  align?: DropdownAlign;
  className?: string;
}

export interface DropdownHandle {
  wrapper: HTMLDivElement;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const ORIGIN_CLASSES: Record<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left', string> = {
  'top-right': 'origin-top-right',
  'top-left': 'origin-top-left',
  'bottom-right': 'origin-bottom-right',
  'bottom-left': 'origin-bottom-left',
};

/**
 * Registro compartido por todas las instancias de `Dropdown` del
 * proyecto (viven en el mismo modulo, por eso alcanza con una variable de
 * modulo — no hace falta una clase "manager" ni un contexto aparte):
 * guarda el `close` del unico Dropdown abierto en un momento dado. Abrir
 * uno nuevo cierra automaticamente el anterior, sin que ningun componente
 * consumidor (RowActions, Navbar, etc.) tenga que coordinarlo.
 */
let activeDropdownClose: (() => void) | null = null;

/**
 * Menu flotante generico (usado por el menu de usuario, notificaciones,
 * acciones de fila, etc.).
 *
 * El panel se renderiza como Portal directo a `document.body` mientras
 * esta abierto (`position: fixed`, posicion calculada respecto al
 * trigger via `computeFloatingPosition`): esto lo independiza por
 * completo de cualquier ancestro con `overflow` (tablas, cards, modales,
 * layouts con scroll), que de otra forma lo recortarian al ser un
 * descendiente `position: absolute`. Al cerrarse, el panel vuelve a su
 * lugar original dentro de `wrapper` — si `wrapper` es descartado por un
 * re-render de la pagina mientras el Dropdown esta cerrado, el panel se
 * descarta con el, sin nodos huerfanos en `document.body`.
 */
export function Dropdown(props: DropdownProps): DropdownHandle {
  const align = props.align ?? 'right';

  const menuItems = props.items.map((item) => {
    const itemClassName = cn(
      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
      'disabled:cursor-not-allowed disabled:opacity-50',
      item.danger
        ? 'text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10'
        : 'text-text-primary hover:bg-surface-muted',
    );
    const children = [item.icon ? Icon({ icon: item.icon, size: 16 }) : null, item.label];

    if (item.href) {
      const link = el(
        'a',
        { href: item.href, 'data-link': 'true', className: itemClassName },
        ...children,
      );
      link.addEventListener('click', () => close());
      return link;
    }

    const button = el(
      'button',
      { type: 'button', disabled: Boolean(item.disabled), className: itemClassName },
      ...children,
    );
    button.addEventListener('click', () => {
      item.onSelect?.();
      close();
    });
    return button;
  });

  const panel = el(
    'div',
    {
      role: 'menu',
      className: cn(
        'fixed z-[60] hidden w-48 scale-95 rounded-lg border border-border-default bg-surface-elevated p-1 opacity-0 shadow-md',
        'transition-all duration-150 ease-out',
        'focus:outline-none',
      ),
      // Foco de respaldo (Fase 15) cuando el menu no tiene ningun item
      // enfocable propio — ver `focusFirstElement`/`trapTabKey`.
      tabindex: '-1',
    },
    ...menuItems,
  );

  const wrapper = el(
    'div',
    { className: cn('relative inline-block', props.className) },
    props.trigger,
    panel,
  );

  let closeTimeout: number | undefined;
  let isOpen = false;
  // Elemento que tenia el foco justo antes de abrir (Fase 15): a donde
  // vuelve el foco al cerrar. Ver `restoreFocus` (utils/focus-trap.ts).
  let previouslyFocused: HTMLElement | null = null;

  function setOrigin(openedUpward: boolean, alignedRight: boolean): void {
    panel.classList.remove(...Object.values(ORIGIN_CLASSES));
    const vertical = openedUpward ? 'bottom' : 'top';
    const horizontal = alignedRight ? 'right' : 'left';
    panel.classList.add(ORIGIN_CLASSES[`${vertical}-${horizontal}`]);
  }

  function positionPanel(): void {
    const triggerRect = props.trigger.getBoundingClientRect();
    const floatingSize = { width: panel.offsetWidth, height: panel.offsetHeight };
    const { top, left, openedUpward, alignedRight } = computeFloatingPosition({
      triggerRect,
      floatingSize,
      align,
    });
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    setOrigin(openedUpward, alignedRight);
  }

  function handleReposition(): void {
    if (!props.trigger.isConnected) {
      close();
      return;
    }
    positionPanel();
  }

  function handleOutsideClick(event: MouseEvent): void {
    if (!(event.target instanceof Node)) return;
    if (wrapper.contains(event.target) || panel.contains(event.target)) return;
    close();
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      close();
      return;
    }
    trapTabKey(event, panel);
  }

  function open(): void {
    if (isOpen) return;
    if (activeDropdownClose && activeDropdownClose !== close) {
      activeDropdownClose();
    }
    activeDropdownClose = close;
    isOpen = true;
    window.clearTimeout(closeTimeout);
    previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.body.appendChild(panel);
    panel.classList.remove('hidden');
    positionPanel();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.classList.remove('opacity-0', 'scale-95');
      });
    });

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    focusFirstElement(panel);
  }

  function close(): void {
    if (!isOpen) return;
    isOpen = false;
    if (activeDropdownClose === close) {
      activeDropdownClose = null;
    }

    panel.classList.add('opacity-0', 'scale-95');
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('scroll', handleReposition, true);
    window.removeEventListener('resize', handleReposition);
    restoreFocus(panel, previouslyFocused);
    previouslyFocused = null;

    closeTimeout = window.setTimeout(() => {
      panel.classList.add('hidden');
      wrapper.appendChild(panel);
    }, 150);
  }

  function toggle(): void {
    if (isOpen) close();
    else open();
  }

  props.trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    toggle();
  });

  return { wrapper, open, close, toggle };
}
