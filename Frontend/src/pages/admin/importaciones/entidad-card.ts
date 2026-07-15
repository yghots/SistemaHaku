import { Download, FileClock, ListChecks, Upload } from 'lucide';
import { infoAlert } from '../../../components/alert/alert';
import { Button } from '../../../components/button/button';
import { Card } from '../../../components/card/card';
import { Dropdown, type DropdownItem } from '../../../components/dropdown/dropdown';
import { HttpError } from '../../../services/http/http-error';
import { ImportacionesService } from '../../../services/importaciones.service';
import { FORMATOS_IMPORTACION } from '../../../types/importacion';
import type { FormatoImportacion } from '../../../types/importacion';
import { downloadBlob } from '../../../utils/download-file';
import { el } from '../../../utils/dom';
import type { EntidadImportacionConfig } from './entidad-importacion.config';
import { HistorialModal } from './historial-modal';
import { ImportWizardModal } from './import-wizard-modal';
import { InstruccionesModal } from './instrucciones-modal';

const ETIQUETA_FORMATO: Record<FormatoImportacion, string> = {
  xlsx: 'Excel (.xlsx)',
  json: 'JSON',
  xml: 'XML',
};

/** Boton "Descargar plantilla": mismo patron Button+Dropdown que `ExportButton` (Fase 18), con los 3 formatos que soporta la importacion. */
function DescargarPlantillaButton(config: EntidadImportacionConfig): HTMLElement {
  const trigger = Button({ label: 'Descargar plantilla', variant: 'outline', icon: Download });

  async function handleDescargar(formato: FormatoImportacion): Promise<void> {
    try {
      const archivo = await ImportacionesService.descargarPlantilla(config.entidad, formato);
      downloadBlob(archivo.blob, archivo.filename);
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : 'No se pudo descargar la plantilla.';
      await infoAlert({ title: 'No se pudo descargar la plantilla', text: message, icon: 'error' });
    }
  }

  const items: DropdownItem[] = FORMATOS_IMPORTACION.map((formato) => ({
    label: ETIQUETA_FORMATO[formato],
    onSelect: () => void handleDescargar(formato),
  }));

  return Dropdown({ trigger, items }).wrapper;
}

/**
 * Tarjeta de una entidad importable (Fase 19): nombre, descripcion,
 * descargar plantilla, ver instrucciones, importar archivo e historial —
 * las 5 acciones que pide el Centro de Importaciones, todas reutilizando
 * componentes existentes (Card, Button, Dropdown, Modal).
 */
export function EntidadImportacionCard(config: EntidadImportacionConfig): HTMLElement {
  const acciones = el(
    'div',
    { className: 'flex flex-wrap gap-3' },
    DescargarPlantillaButton(config),
    Button({
      label: 'Ver instrucciones',
      variant: 'outline',
      icon: ListChecks,
      onClick: () => InstruccionesModal(config).open(),
    }),
    Button({
      label: 'Importar archivo',
      icon: Upload,
      onClick: () => ImportWizardModal(config).open(),
    }),
    Button({
      label: 'Historial',
      variant: 'ghost',
      icon: FileClock,
      onClick: () => HistorialModal(config).open(),
    }),
  );

  return Card({
    title: config.nombre,
    subtitle: config.descripcion,
    children: acciones,
  });
}
