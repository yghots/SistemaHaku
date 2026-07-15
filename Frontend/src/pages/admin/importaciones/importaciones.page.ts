import { PageHeader } from '../../../components/page-header/page-header';
import { el } from '../../../utils/dom';
import { EntidadImportacionCard } from './entidad-card';
import { ENTIDADES_IMPORTACION_CONFIG } from './entidad-importacion.config';

/**
 * Centro de Importaciones (Fase 19): unico punto de entrada para toda
 * importacion masiva del sistema. Una tarjeta por entidad soportada
 * (Clientes, Tiendas, Motorizados) — agregar una entidad nueva es agregar
 * un item a `ENTIDADES_IMPORTACION_CONFIG`, nunca una pantalla nueva.
 */
export function ImportacionesPage(): HTMLElement {
  return el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Centro de Importaciones',
      description:
        'Importa datos masivamente de forma segura, validada y reutilizable: descarga la plantilla oficial, revisa las instrucciones, sube tu archivo y confirma tras revisar la vista previa.',
      breadcrumb: [{ label: 'Importaciones' }],
    }),
    el(
      'div',
      { className: 'grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3' },
      ...ENTIDADES_IMPORTACION_CONFIG.map((config) => EntidadImportacionCard(config)),
    ),
  );
}
