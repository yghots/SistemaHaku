import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface SectionProps {
  title?: string;
  description?: string;
  actions?: HTMLElement;
  children: Node | Node[];
  className?: string;
}

/** Agrupador de contenido dentro de una pagina (sin borde/sombra, a diferencia de Card). Usado para separar bloques dentro del area principal. */
export function Section(props: SectionProps): HTMLElement {
  const hasHeader = props.title || props.description || props.actions;

  const children = Array.isArray(props.children) ? props.children : [props.children];

  return el(
    'section',
    { className: cn('flex flex-col gap-4', props.className) },
    hasHeader
      ? el(
          'div',
          { className: 'flex items-center justify-between gap-4' },
          el(
            'div',
            { className: 'flex flex-col gap-0.5' },
            props.title
              ? el('h2', { className: 'text-lg font-semibold text-text-primary' }, props.title)
              : null,
            props.description
              ? el('p', { className: 'text-sm text-text-muted' }, props.description)
              : null,
          ),
          props.actions ?? null,
        )
      : null,
    ...children,
  );
}
