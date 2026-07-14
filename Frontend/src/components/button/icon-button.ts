import type { IconNode } from 'lucide';
import { Icon } from '../icon/icon';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';
import { BUTTON_VARIANT_CLASSES, type ButtonVariant } from './button';

export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps {
  icon: IconNode;
  /** Obligatorio: no hay texto visible, este es el unico nombre accesible del boton. */
  label: string;
  variant?: ButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  className?: string;
  onClick?: (event: MouseEvent) => void;
}

const SIZE_CLASSES: Record<
  IconButtonSize,
  { box: string; icon: number; expandTouchTarget: boolean }
> = {
  // 32px visual: mas chico que los 44px recomendados por HIG/Material,
  // pero se mantiene por ser el tamaño usado en filas densas de tabla
  // (RowActions) y toolbars compactos, donde agrandar el boton visible
  // rompe el ritmo vertical. En su lugar se agranda solo el AREA de toque
  // (pseudo-elemento invisible, ver `before:` abajo) sin tocar el tamaño
  // visual — la recomendacion explicita de Fase 13 para este caso.
  sm: { box: 'h-8 w-8', icon: 16, expandTouchTarget: true },
  md: { box: 'h-11 w-11', icon: 18, expandTouchTarget: false },
  lg: { box: 'h-12 w-12', icon: 20, expandTouchTarget: false },
};

/** Boton de icono unico (sin texto) para acciones secundarias/toolbar. Reutiliza la paleta de variantes de Button. */
export function IconButton(props: IconButtonProps): HTMLButtonElement {
  const variant = props.variant ?? 'ghost';
  const size = SIZE_CLASSES[props.size ?? 'md'];

  const button = el(
    'button',
    {
      type: 'button',
      disabled: Boolean(props.disabled),
      'aria-label': props.label,
      title: props.label,
      className: cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-lg transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        BUTTON_VARIANT_CLASSES[variant],
        size.box,
        // Area de toque invisible de 44x44 centrada sobre el boton, sin
        // alterar su tamaño visual (recomendacion Apple HIG / Material
        // Design). `content-['']` es indispensable: sin contenido el
        // pseudo-elemento no se genera ni recibe eventos de puntero.
        size.expandTouchTarget &&
          "before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
        props.className,
      ),
    },
    Icon({ icon: props.icon, size: size.icon }),
  );

  if (props.onClick) {
    button.addEventListener('click', props.onClick);
  }

  return button;
}
