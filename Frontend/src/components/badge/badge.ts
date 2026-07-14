import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-muted text-text-secondary',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  success: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-400',
  info: 'bg-info-50 text-info-700 dark:bg-info-500/15 dark:text-info-400',
};

/**
 * Etiqueta de estado generica y reutilizable. NO crear badges especificos
 * por modulo (ej. "EstadoPedidoBadge"): mapear el valor de negocio a un
 * BadgeVariant en el punto de uso y reutilizar este componente.
 */
export function Badge({ label, variant = 'neutral', className }: BadgeProps): HTMLSpanElement {
  return el(
    'span',
    {
      className: cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className,
      ),
    },
    label,
  );
}
