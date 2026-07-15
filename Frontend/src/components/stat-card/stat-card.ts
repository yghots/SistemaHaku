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
  up: 'text-success-600 dark-ui:text-success-400',
  down: 'text-danger-600 dark-ui:text-danger-400',
  neutral: 'text-text-muted',
};

/** Mismos tokens `--color-soft-*` que Badge (`src/styles/index.css`) — el icono-chip y el badge de un mismo estado usan exactamente el mismo color en los 3 temas. */
const VARIANT_ICON_CLASSES: Record<StatCardVariant, string> = {
  brand: 'bg-soft-brand-bg text-soft-brand-fg',
  success: 'bg-soft-success-bg text-soft-success-fg',
  warning: 'bg-soft-warning-bg text-soft-warning-fg',
  danger: 'bg-soft-danger-bg text-soft-danger-fg',
  info: 'bg-soft-info-bg text-soft-info-fg',
  neutral: 'bg-surface-hover text-text-secondary',
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
