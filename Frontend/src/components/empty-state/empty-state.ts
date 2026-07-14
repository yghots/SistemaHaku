import type { IconNode } from 'lucide';
import { Icon } from '../icon/icon';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface EmptyStateProps {
  icon?: IconNode;
  title: string;
  description?: string;
  action?: HTMLElement;
  className?: string;
}

/** Estado vacio generico: usado por DataTable y por cualquier listado sin resultados. */
export function EmptyState(props: EmptyStateProps): HTMLDivElement {
  return el(
    'div',
    {
      className: cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        props.className,
      ),
    },
    props.icon
      ? el(
          'div',
          { className: 'rounded-full bg-surface-muted p-3 text-text-muted' },
          Icon({ icon: props.icon, size: 24 }),
        )
      : null,
    el('p', { className: 'text-sm font-medium text-text-primary' }, props.title),
    props.description
      ? el('p', { className: 'max-w-sm text-sm text-text-muted' }, props.description)
      : null,
    props.action ?? null,
  );
}
