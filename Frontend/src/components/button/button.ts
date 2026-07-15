import type { IconNode } from 'lucide';
import { Icon } from '../icon/icon';
import { Loader } from '../loader/loader';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icono lucide mostrado antes del texto (se oculta mientras loading = true). */
  icon?: IconNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: (event: MouseEvent) => void;
}

/** Exportado para que IconButton reutilice exactamente la misma paleta de variantes (DRY). */
export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-button hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-brand-600',
  secondary:
    'bg-surface-muted text-text-primary hover:bg-border-default focus-visible:outline-text-muted dark-ui:hover:bg-white/10',
  outline:
    'border border-border-default text-text-secondary hover:bg-surface-hover focus-visible:outline-text-muted',
  danger:
    'bg-danger-600 text-white shadow-button hover:bg-danger-700 active:bg-danger-800 focus-visible:outline-danger-600',
  ghost:
    'text-text-secondary hover:bg-surface-hover focus-visible:outline-text-muted dark-ui:hover:bg-white/10',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

/** Boton unico y configurable para todo el proyecto (Admin y Rider). */
export function Button(props: ButtonProps): HTMLButtonElement {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';
  const isDisabled = Boolean(props.disabled || props.loading);

  const button = el('button', {
    type: props.type ?? 'button',
    disabled: isDisabled,
    className: cn(
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      BUTTON_VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      props.fullWidth && 'w-full',
      props.className,
    ),
  });

  if (props.loading) {
    button.appendChild(Loader({ size: 16 }));
  } else if (props.icon) {
    button.appendChild(Icon({ icon: props.icon, size: 16 }));
  }

  button.appendChild(document.createTextNode(props.label));

  if (props.onClick) {
    button.addEventListener('click', props.onClick);
  }

  return button;
}
