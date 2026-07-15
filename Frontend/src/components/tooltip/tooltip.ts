import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: string;
  /** Elemento que dispara el tooltip al hacer hover/focus. */
  children: HTMLElement;
  position?: TooltipPosition;
  className?: string;
}

const POSITION_CLASSES: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

/**
 * Envuelve `children` y muestra `content` en un globo flotante al hacer
 * hover/focus. Puramente CSS (`group-hover`/`group-focus-within`): sin
 * listeners de JS, animacion de opacidad suave.
 */
export function Tooltip(props: TooltipProps): HTMLSpanElement {
  const position = props.position ?? 'top';

  const bubble = el(
    'span',
    {
      role: 'tooltip',
      className: cn(
        // `max-w` + `whitespace-normal` en vez de `whitespace-nowrap` sin
        // limite: a diferencia de Dropdown (Portal + computeFloatingPosition),
        // este tooltip es puramente CSS y no mide el viewport disponible —
        // sin un limite de ancho, un `content` largo cerca de un borde
        // pequeño (ej. Sidebar colapsado en una ventana angosta) se saldria
        // de la pantalla. `calc(100vw-1rem)` deja como maximo el ancho del
        // viewport con un margen de seguridad, sin afectar el caso normal.
        'pointer-events-none absolute z-40 max-w-[calc(100vw-1rem)] whitespace-normal rounded-md bg-tooltip-bg px-2 py-1 text-xs text-tooltip-fg shadow-md',
        'opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100',
        POSITION_CLASSES[position],
      ),
    },
    props.content,
  );

  return el(
    'span',
    { className: cn('group relative inline-flex', props.className) },
    props.children,
    bubble,
  );
}
