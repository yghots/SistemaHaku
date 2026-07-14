import dayjs from 'dayjs';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface FooterProps {
  appName: string;
  className?: string;
}

/** Pie de pagina minimo, compartido por los 3 layouts. */
export function Footer({ appName, className }: FooterProps): HTMLElement {
  const year = dayjs().year();

  return el(
    'footer',
    {
      className: cn(
        'flex shrink-0 items-center justify-center border-t border-border-default px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-xs text-text-muted',
        className,
      ),
    },
    `© ${year} ${appName}. Todos los derechos reservados.`,
  );
}
