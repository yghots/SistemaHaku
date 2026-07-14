import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  /** Nombre completo, usado para las iniciales cuando no hay `src`. */
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Avatar de usuario unico y reutilizable: imagen si hay `src`, iniciales si no. */
export function Avatar(props: AvatarProps): HTMLElement {
  const size = props.size ?? 'md';
  const baseClassName = cn(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium',
    SIZE_CLASSES[size],
    props.className,
  );

  if (props.src) {
    return el('img', {
      src: props.src,
      alt: props.name,
      className: cn(baseClassName, 'object-cover'),
    });
  }

  return el(
    'span',
    {
      className: cn(
        baseClassName,
        'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400',
      ),
    },
    getInitials(props.name) || '?',
  );
}
