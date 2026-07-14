import { createElement, type IconNode } from 'lucide';
import { cn } from '../../utils/cn';

export interface IconProps {
  /** Icono de lucide, ej. `import { Menu } from 'lucide'` */
  icon: IconNode;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * Unico punto de entrada para renderizar iconos en todo el proyecto.
 * Nunca importar SVGs de otra libreria ni escribir markup de icono a mano.
 */
export function Icon({ icon, size = 20, className, strokeWidth = 2 }: IconProps): SVGElement {
  const svg = createElement(icon, {
    width: String(size),
    height: String(size),
    'stroke-width': String(strokeWidth),
  });
  svg.setAttribute('class', cn('shrink-0', className));
  return svg;
}
