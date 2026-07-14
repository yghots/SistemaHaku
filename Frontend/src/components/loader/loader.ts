import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface LoaderProps {
  size?: number;
  className?: string;
  label?: string;
}

/** Spinner generico. Usado por Button (estado loading) y por pantallas mientras cargan datos. */
export function Loader({
  size = 24,
  className,
  label = 'Cargando',
}: LoaderProps = {}): HTMLSpanElement {
  return el('span', {
    className: cn(
      'inline-block animate-spin rounded-full border-2 border-current border-t-transparent align-middle',
      className,
    ),
    style: { width: `${size}px`, height: `${size}px` },
    role: 'status',
    'aria-label': label,
  });
}
