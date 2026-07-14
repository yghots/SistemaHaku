import { Construction } from 'lucide';
import { EmptyState } from '../components/empty-state/empty-state';
import { PageHeader } from '../components/page-header/page-header';
import type { RouteBreadcrumbItem } from '../router/router';
import { el } from '../utils/dom';

/**
 * Pagina generica para cualquier ruta registrada en el Sidebar que todavia
 * no tiene una pantalla real (Fase 3+). Evita crear un archivo de pagina
 * vacio por cada modulo pendiente.
 */
export function PlaceholderPage(title: string, breadcrumb: RouteBreadcrumbItem[]): HTMLElement {
  return el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({ title, breadcrumb }),
    EmptyState({
      icon: Construction,
      title: 'Modulo en construccion',
      description: `La pantalla de "${title}" se implementara en una fase posterior.`,
    }),
  );
}
