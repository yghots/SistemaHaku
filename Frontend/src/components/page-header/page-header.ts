import { Breadcrumb, type BreadcrumbItem } from '../breadcrumb/breadcrumb';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: HTMLElement;
  className?: string;
}

/** Encabezado unico de pagina: breadcrumb + titulo + descripcion + acciones. Usado al inicio de toda pagina real. */
export function PageHeader(props: PageHeaderProps): HTMLDivElement {
  return el(
    'div',
    { className: cn('flex flex-col gap-3 pb-6', props.className) },
    props.breadcrumb ? Breadcrumb({ items: props.breadcrumb }) : null,
    el(
      'div',
      { className: 'flex flex-wrap items-center justify-between gap-4' },
      el(
        'div',
        { className: 'flex flex-col gap-1' },
        el('h1', { className: 'text-2xl font-semibold text-text-primary' }, props.title),
        props.description
          ? el('p', { className: 'text-sm text-text-muted' }, props.description)
          : null,
      ),
      props.actions ?? null,
    ),
  );
}
