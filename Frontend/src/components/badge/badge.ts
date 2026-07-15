import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export type BadgeVariant =
  'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'dangerStrong' | 'info';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Todas las variantes de color consumen los tokens `--color-soft-*`
 * (`src/styles/index.css`) — nunca `dark:`/color crudo aqui: el valor
 * exacto por tema (Light/Dark/Midnight) vive unicamente en esos tokens,
 * este componente no sabe ni necesita saber que tema esta activo.
 */
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-hover text-text-secondary',
  brand: 'bg-soft-brand-bg text-soft-brand-fg',
  success: 'bg-soft-success-bg text-soft-success-fg',
  warning: 'bg-soft-warning-bg text-soft-warning-fg',
  danger: 'bg-soft-danger-bg text-soft-danger-fg',
  dangerStrong: 'bg-soft-danger-strong-bg text-soft-danger-strong-fg',
  info: 'bg-soft-info-bg text-soft-info-fg',
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
