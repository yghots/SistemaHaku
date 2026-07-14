import { ChevronLeft, ChevronRight } from 'lucide';
import { Icon } from '../icon/icon';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageButtonClasses(active: boolean): string {
  return cn(
    'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
    active
      ? 'bg-brand-600 text-white'
      : 'text-text-secondary hover:bg-surface-muted dark:hover:bg-white/10',
  );
}

/** Paginacion generica. Declarativa: recibe `page`/`totalPages` y notifica `onPageChange`; el consumidor decide como volver a renderizar. */
export function Pagination(props: PaginationProps): HTMLDivElement {
  const { page, totalPages, onPageChange } = props;

  const prevButton = el(
    'button',
    {
      type: 'button',
      disabled: page <= 1,
      'aria-label': 'Pagina anterior',
      className: cn(pageButtonClasses(false), 'disabled:cursor-not-allowed disabled:opacity-40'),
    },
    Icon({ icon: ChevronLeft, size: 16 }),
  );
  prevButton.addEventListener('click', () => onPageChange(page - 1));

  const nextButton = el(
    'button',
    {
      type: 'button',
      disabled: page >= totalPages,
      'aria-label': 'Pagina siguiente',
      className: cn(pageButtonClasses(false), 'disabled:cursor-not-allowed disabled:opacity-40'),
    },
    Icon({ icon: ChevronRight, size: 16 }),
  );
  nextButton.addEventListener('click', () => onPageChange(page + 1));

  const pageButtons = getVisiblePages(page, totalPages).map((pageNumber) => {
    if (pageNumber === null) {
      return el('span', { className: 'px-1 text-sm text-text-muted' }, '…');
    }
    const button = el(
      'button',
      { type: 'button', className: pageButtonClasses(pageNumber === page) },
      String(pageNumber),
    );
    button.addEventListener('click', () => onPageChange(pageNumber));
    return button;
  });

  return el(
    'div',
    { className: cn('flex items-center gap-1', props.className) },
    prevButton,
    ...pageButtons,
    nextButton,
  );
}

/** Calcula que numeros de pagina mostrar, con `null` como separador "…" para rangos largos. */
function getVisiblePages(current: number, total: number): Array<number | null> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: Array<number | null> = [];
  let previous: number | undefined;
  for (const p of sorted) {
    if (previous !== undefined && p - previous > 1) result.push(null);
    result.push(p);
    previous = p;
  }
  return result;
}
