import { ChevronRight } from 'lucide';
import { Icon } from '../icon/icon';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface BreadcrumbItem {
  label: string;
  /** Si se omite, el item se muestra como texto plano (usado para el ultimo, la pagina actual). */
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/** Ruta de navegacion generica. Los enlaces usan `data-link` para integrarse con el router SPA. */
export function Breadcrumb({ items, className }: BreadcrumbProps): HTMLElement {
  const listItems = items.map((item, index) => {
    const isLast = index === items.length - 1;

    const content =
      item.href && !isLast
        ? el(
            'a',
            {
              href: item.href,
              'data-link': 'true',
              className: 'text-text-secondary transition-colors hover:text-text-primary',
            },
            item.label,
          )
        : el('span', { className: 'text-text-primary font-medium' }, item.label);

    const children: Node[] = [content];
    if (!isLast) {
      children.push(
        el('span', { className: 'text-text-muted' }, Icon({ icon: ChevronRight, size: 14 })),
      );
    }

    return el('li', { className: 'flex items-center gap-2' }, ...children);
  });

  return el(
    'nav',
    { className: cn('flex', className), 'aria-label': 'Breadcrumb' },
    el('ol', { className: 'flex items-center gap-2 text-sm' }, ...listItems),
  );
}
