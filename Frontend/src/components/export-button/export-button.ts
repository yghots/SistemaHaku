import { Download } from 'lucide';
import { infoAlert } from '../alert/alert';
import { showSuccessToast } from '../toast/toast';
import { HttpError } from '../../services/http/http-error';
import { FORMATOS_EXPORTACION_OPTIONS } from '../../types/export';
import type { FormatoExportacion } from '../../types/export';
import { Button } from '../button/button';
import { Dropdown, type DropdownItem } from '../dropdown/dropdown';

export interface ExportButtonProps {
  /**
   * Ejecuta la exportacion para el formato elegido (llamar al servicio
   * correspondiente + `downloadBlob`) — este componente no conoce el
   * reporte, el endpoint ni el formato de archivo, solo delega.
   */
  onExport: (formato: FormatoExportacion) => Promise<void>;
}

/**
 * Boton "Exportar" generico y reutilizable para cualquier reporte
 * (Fase 18): un unico Dropdown con los 5 formatos soportados por la
 * infraestructura de exportacion del backend, en vez de un boton por
 * formato. Reutiliza `Button` + `Dropdown` tal cual existen — no crea
 * variantes nuevas de ninguno de los dos.
 */
export function ExportButton(props: ExportButtonProps): HTMLElement {
  let loading = false;

  const trigger = Button({ label: 'Exportar', icon: Download, variant: 'outline' });

  const items: DropdownItem[] = FORMATOS_EXPORTACION_OPTIONS.map((formato) => ({
    label: formato.label,
    onSelect: () => void handleExport(formato.value),
  }));

  const handle = Dropdown({ trigger, items, align: 'right' });

  async function handleExport(formato: FormatoExportacion): Promise<void> {
    if (loading) return;
    loading = true;
    trigger.disabled = true;
    try {
      await props.onExport(formato);
      showSuccessToast('Archivo exportado correctamente');
    } catch (error) {
      const message = error instanceof HttpError ? error.message : 'No se pudo generar el archivo.';
      await infoAlert({ title: 'No se pudo exportar el reporte', text: message, icon: 'error' });
    } finally {
      loading = false;
      trigger.disabled = false;
    }
  }

  return handle.wrapper;
}
