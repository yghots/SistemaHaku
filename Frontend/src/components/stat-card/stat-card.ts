import type { IconNode } from 'lucide';
import { ArrowDown, ArrowUp } from 'lucide';
import { Icon } from '../icon/icon';
import { Skeleton } from '../skeleton/skeleton';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export type StatTrendDirection = 'up' | 'down' | 'neutral';

export interface StatTrend {
  value: string;
  direction: StatTrendDirection;
}

/** Color semantico del icono. `brand` (default) es neutro/informativo; el resto sigue la misma paleta que Badge. */
export type StatCardVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatCardProps {
  label: string;
  value: string | number;
  /** Texto secundario debajo del valor (ej. "vs. el periodo anterior", o una aclaracion del calculo). */
  description?: string;
  icon?: IconNode;
  variant?: StatCardVariant;
  trend?: StatTrend;
  /** Mientras es true, muestra placeholders (Skeleton) en vez de valor/descripcion/tendencia. */
  loading?: boolean;
  className?: string;
}

const TREND_CLASSES: Record<StatTrendDirection, string> = {
  up: 'text-success-600 dark:text-success-400',
  down: 'text-danger-600 dark:text-danger-400',
  neutral: 'text-text-muted',
};

const VARIANT_ICON_CLASSES: Record<StatCardVariant, string> = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
  success: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
  danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400',
  info: 'bg-info-50 text-info-600 dark:bg-info-500/15 dark:text-info-400',
  neutral: 'bg-surface-muted text-text-secondary',
};

/**
 * Tarjeta de indicador (KPI) generica y unica del proyecto — reutilizada
 * por el Dashboard y por los Reportes (Fase 9). Responsabilidad visual
 * distinta de Card: layout fijo icono+valor+etiqueta+descripcion/tendencia.
 * No crear una tarjeta de KPI especifica por modulo: configurar esta via props.
 */
export function StatCard(props: StatCardProps): HTMLDivElement {
  const trend = props.trend;
  const variant = props.variant ?? 'brand';

  return el(
    'div',
    {
      className: cn(
        'flex flex-col gap-3 rounded-xl border border-border-default bg-surface-elevated p-5 shadow-sm',
        props.className,
      ),
    },
    el(
      'div',
      { className: 'flex items-center justify-between' },
      el('span', { className: 'text-sm font-medium text-text-secondary' }, props.label),
      props.icon
        ? el(
            'span',
            { className: cn('rounded-lg p-2', VARIANT_ICON_CLASSES[variant]) },
            Icon({ icon: props.icon, size: 18 }),
          )
        : null,
    ),
    props.loading
      ? Skeleton({ width: '4rem', height: '1.75rem' })
      : el('span', { className: 'text-2xl font-semibold text-text-primary' }, String(props.value)),
    props.loading
      ? Skeleton({ width: '6rem', height: '0.875rem' })
      : props.description
        ? el('p', { className: 'text-xs text-text-muted' }, props.description)
        : null,
    !props.loading && trend
      ? el(
          'div',
          {
            className: cn(
              'flex items-center gap-1 text-xs font-medium',
              TREND_CLASSES[trend.direction],
            ),
          },
          trend.direction !== 'neutral'
            ? Icon({ icon: trend.direction === 'up' ? ArrowUp : ArrowDown, size: 12 })
            : null,
          trend.value,
        )
      : null,
  );
}
