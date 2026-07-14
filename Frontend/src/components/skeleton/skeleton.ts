import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  className?: string;
}

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  text: 'rounded h-4',
  circle: 'rounded-full',
  rect: 'rounded-lg',
};

/** Placeholder de carga generico (animacion de pulso). Usado mientras se espera una respuesta de la API. */
export function Skeleton(props: SkeletonProps = {}): HTMLDivElement {
  const variant = props.variant ?? 'text';

  return el('div', {
    className: cn('animate-pulse bg-surface-muted', VARIANT_CLASSES[variant], props.className),
    style: {
      ...(props.width ? { width: props.width } : {}),
      ...(props.height ? { height: props.height } : {}),
    },
  });
}
