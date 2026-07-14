import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface CardProps {
  title?: string;
  subtitle?: string;
  /** Contenido del cuerpo de la card. Acepta uno o varios nodos ya construidos. */
  children?: Node | Node[];
  /** Contenido opcional a la derecha del titulo (ej. un Button de accion). */
  headerActions?: Node;
  footer?: Node;
  className?: string;
  padded?: boolean;
}

/** Contenedor visual unico para agrupar contenido en todo el proyecto. */
export function Card(props: CardProps): HTMLDivElement {
  const card = el('div', {
    className: cn(
      'rounded-xl border border-border-default bg-surface-elevated shadow-sm',
      props.className,
    ),
  });

  const hasHeader = props.title || props.subtitle || props.headerActions;
  if (hasHeader) {
    const titleBlock = el('div', { className: 'flex flex-col gap-0.5' });
    if (props.title) {
      titleBlock.appendChild(
        el('h2', { className: 'text-base font-semibold text-text-primary' }, props.title),
      );
    }
    if (props.subtitle) {
      titleBlock.appendChild(el('p', { className: 'text-sm text-text-muted' }, props.subtitle));
    }

    const header = el(
      'div',
      {
        className:
          'flex items-center justify-between gap-4 border-b border-border-default px-5 py-4',
      },
      titleBlock,
    );
    if (props.headerActions) {
      header.appendChild(props.headerActions);
    }
    card.appendChild(header);
  }

  const body = el('div', { className: props.padded === false ? '' : 'p-5' });
  if (props.children) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    for (const child of children) body.appendChild(child);
  }
  card.appendChild(body);

  if (props.footer) {
    card.appendChild(
      el('div', { className: 'border-t border-border-default px-5 py-4' }, props.footer),
    );
  }

  return card;
}
