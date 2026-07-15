import { Modal, type ModalHandle } from '../../../components/modal/modal';
import { Button } from '../../../components/button/button';
import { FORMATOS_IMPORTACION } from '../../../types/importacion';
import { el } from '../../../utils/dom';
import type { EntidadImportacionConfig } from './entidad-importacion.config';

function seccion(titulo: string, contenido: Node): HTMLElement {
  return el(
    'div',
    { className: 'flex flex-col gap-1.5' },
    el('h3', { className: 'text-sm font-semibold text-text-primary' }, titulo),
    contenido,
  );
}

function lista(items: string[]): HTMLUListElement {
  return el(
    'ul',
    { className: 'list-disc space-y-1 pl-5 text-sm text-text-secondary' },
    ...items.map((item) => el('li', {}, item)),
  );
}

function parrafo(texto: string): HTMLParagraphElement {
  return el('p', { className: 'text-sm text-text-secondary' }, texto);
}

/**
 * Instrucciones de importacion de una entidad (Fase 19): formatos validos,
 * campos obligatorios/opcionales, no modificar encabezados, como corregir
 * errores, que ocurre con duplicados — contenido estatico por entidad
 * (`entidad-importacion.config.ts`), no generado por el backend.
 */
export function InstruccionesModal(config: EntidadImportacionConfig): ModalHandle {
  const content = el(
    'div',
    { className: 'flex flex-col gap-5' },
    seccion(
      'Formatos validos',
      lista(FORMATOS_IMPORTACION.map((formato) => formato.toUpperCase())),
    ),
    seccion('Campos obligatorios', lista(config.camposObligatorios)),
    config.camposOpcionales.length > 0
      ? seccion('Campos opcionales', lista(config.camposOpcionales))
      : null,
    seccion(
      'Encabezados',
      parrafo(
        'No modifiques los nombres de las columnas de la plantilla oficial (primera fila en Excel, claves en JSON, etiquetas en XML) — un encabezado distinto hace que esa columna se ignore.',
      ),
    ),
    seccion(
      'Duplicados',
      parrafo(
        `Se consideran duplicados segun: ${config.reglaDuplicados} Un registro duplicado se omite automaticamente — nunca se sobrescribe informacion existente ni se crea un registro repetido.`,
      ),
    ),
    seccion(
      'Como corregir errores',
      parrafo(
        'Al finalizar una importacion, descarga el reporte de errores (Excel) desde el resultado o desde el Historial: incluye la fila, el motivo y el valor recibido de cada registro no importado. Corrige esos datos en tu archivo original y vuelve a importar — los registros ya importados se detectan como duplicados y se omiten, nunca se duplican.',
      ),
    ),
    config.notaAdicional ? seccion('Nota', parrafo(config.notaAdicional)) : null,
  );

  const cerrarButton = Button({
    label: 'Cerrar',
    variant: 'secondary',
    onClick: () => modal.close(),
  });
  const footer = el('div', {}, cerrarButton);

  const modal = Modal({
    title: `Instrucciones — ${config.nombre}`,
    content,
    footer,
    size: 'lg',
    onClose: () => modal.destroy(),
  });

  return modal;
}
