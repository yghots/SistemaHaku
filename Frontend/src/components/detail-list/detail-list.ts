import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface DetailField {
  label: string;
  value: string | Node;
}

export interface DetailListProps {
  fields: DetailField[];
  className?: string;
}

/**
 * Lista generica de pares etiqueta/valor, usada por la vista "Ver detalle"
 * de cualquier modulo (no crear un componente de detalle especifico por
 * modulo: configurar `fields`).
 */
export function DetailList({ fields, className }: DetailListProps): HTMLDivElement {
  return el(
    'div',
    { className: cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className) },
    ...fields.map((field) =>
      el(
        'div',
        { className: 'flex flex-col gap-1' },
        el(
          'span',
          { className: 'text-xs font-medium uppercase tracking-wide text-text-muted' },
          field.label,
        ),
        el('span', { className: 'text-sm text-text-primary' }, field.value),
      ),
    ),
  );
}
