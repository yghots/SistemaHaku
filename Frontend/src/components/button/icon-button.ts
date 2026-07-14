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

const SIZE_CLASSES: Record<IconButtonSize, { box: string; icon: number }> = {
  sm: { box: 'h-8 w-8', icon: 16 },
  md: { box: 'h-10 w-10', icon: 18 },
  lg: { box: 'h-12 w-12', icon: 20 },
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
        'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        BUTTON_VARIANT_CLASSES[variant],
        size.box,
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
