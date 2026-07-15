import { AlertTriangle, CheckCircle2, Copy, FileWarning, Upload } from 'lucide';
import { infoAlert } from '../../../components/alert/alert';
import { Badge } from '../../../components/badge/badge';
import { Button } from '../../../components/button/button';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import { DataTable } from '../../../components/datatable/datatable';
import { Loader } from '../../../components/loader/loader';
import { Modal, type ModalHandle } from '../../../components/modal/modal';
import { StatCard } from '../../../components/stat-card/stat-card';
import { HttpError } from '../../../services/http/http-error';
import { ImportacionesService } from '../../../services/importaciones.service';
import { SessionService } from '../../../services/session.service';
import type {
  EntidadImportacion,
  FormatoImportacion,
  ResultadoFilaImportacion,
  ResultadoImportacion,
} from '../../../types/importacion';
import { downloadBlob } from '../../../utils/download-file';
import { el } from '../../../utils/dom';
import { formatOptional } from '../../../utils/format-optional';
import type { EntidadImportacionConfig } from './entidad-importacion.config';

const FORMATO_POR_EXTENSION: Record<string, FormatoImportacion> = {
  xlsx: 'xlsx',
  json: 'json',
  xml: 'xml',
};

function detectarFormato(archivo: File): FormatoImportacion | null {
  const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
  return FORMATO_POR_EXTENSION[extension] ?? null;
}

const COLUMNAS_FILAS: DataTableColumn<ResultadoFilaImportacion>[] = [
  { key: 'fila', header: 'Fila' },
  {
    key: 'estado',
    header: 'Estado',
    render: (row) =>
      Badge({
        label: row.estado === 'duplicado' ? 'Duplicado' : 'Invalido',
        variant: row.estado === 'duplicado' ? 'warning' : 'danger',
      }),
  },
  { key: 'motivo', header: 'Motivo' },
  { key: 'campo', header: 'Campo', render: (row) => formatOptional(row.campo) },
  { key: 'valor', header: 'Valor', render: (row) => formatOptional(row.valor) },
];

/**
 * Flujo obligatorio de importacion (Fase 19): seleccionar archivo ->
 * analizar (vista previa, sin escribir nada) -> confirmar (importacion
 * real, transaccional por fila) -> resultado. Un unico Modal cuyo
 * contenido se reemplaza por paso (mismo patron que cualquier modal de
 * varios pasos: un contenedor estable, sin anidar modales).
 */
export function ImportWizardModal(config: EntidadImportacionConfig): ModalHandle {
  const entidad: EntidadImportacion = config.entidad;

  let archivoSeleccionado: File | null = null;
  let formatoSeleccionado: FormatoImportacion | null = null;
  let resultadoAnalisis: ResultadoImportacion | null = null;

  const stepContainer = el('div', { className: 'min-h-[16rem]' });
  const footerContainer = el('div', { className: 'flex justify-end gap-3' });

  const modal = Modal({
    title: `Importar ${config.nombre}`,
    content: stepContainer,
    footer: footerContainer,
    size: 'lg',
    closeOnBackdropClick: false,
    onClose: () => modal.destroy(),
  });

  function renderStep(content: Node, footerButtons: Node[]): void {
    stepContainer.replaceChildren(content);
    footerContainer.replaceChildren(...footerButtons);
  }

  function renderSeleccionar(): void {
    const fileInput = el('input', {
      type: 'file',
      accept: '.xlsx,.json,.xml',
      className: 'hidden',
    });
    const fileNameLabel = el(
      'span',
      { className: 'text-sm text-text-secondary' },
      archivoSeleccionado ? archivoSeleccionado.name : 'Ningun archivo seleccionado',
    );
    const errorLabel = el('p', { className: 'text-sm text-danger-600 dark-ui:text-danger-400' });

    const analizarButton = Button({
      label: 'Analizar',
      disabled: !archivoSeleccionado,
      onClick: () => void handleAnalizar(),
    });

    fileInput.addEventListener('change', () => {
      const archivo = fileInput.files?.[0] ?? null;
      errorLabel.textContent = '';
      if (!archivo) {
        archivoSeleccionado = null;
        formatoSeleccionado = null;
        fileNameLabel.textContent = 'Ningun archivo seleccionado';
        analizarButton.disabled = true;
        return;
      }

      const formato = detectarFormato(archivo);
      if (!formato) {
        archivoSeleccionado = null;
        formatoSeleccionado = null;
        fileNameLabel.textContent = 'Ningun archivo seleccionado';
        errorLabel.textContent = 'Formato no soportado. Usa un archivo .xlsx, .json o .xml.';
        analizarButton.disabled = true;
        return;
      }

      archivoSeleccionado = archivo;
      formatoSeleccionado = formato;
      fileNameLabel.textContent = archivo.name;
      analizarButton.disabled = false;
    });

    const content = el(
      'div',
      { className: 'flex flex-col gap-4' },
      el(
        'p',
        { className: 'text-sm text-text-secondary' },
        'Selecciona el archivo con los registros a importar (formatos soportados: Excel, JSON o XML).',
      ),
      el(
        'div',
        { className: 'flex items-center gap-3' },
        Button({
          label: 'Seleccionar archivo',
          variant: 'outline',
          icon: Upload,
          onClick: () => fileInput.click(),
        }),
        fileNameLabel,
      ),
      fileInput,
      errorLabel,
    );

    renderStep(content, [
      Button({ label: 'Cancelar', variant: 'secondary', onClick: () => modal.close() }),
      analizarButton,
    ]);
  }

  function renderCargando(mensaje: string): void {
    renderStep(
      el(
        'div',
        { className: 'flex flex-col items-center justify-center gap-3 py-10' },
        Loader({ size: 32 }),
        el('p', { className: 'text-sm text-text-secondary' }, mensaje),
      ),
      [],
    );
  }

  function buildResumenCards(resultado: ResultadoImportacion, etiquetaExito: string): HTMLElement {
    return el(
      'div',
      { className: 'grid grid-cols-2 gap-4 sm:grid-cols-4' },
      StatCard({
        label: 'Encontrados',
        value: resultado.totalEncontrados,
        icon: FileWarning,
        variant: 'neutral',
      }),
      StatCard({
        label: etiquetaExito,
        value: resultado.importados,
        icon: CheckCircle2,
        variant: 'success',
      }),
      StatCard({
        label: 'Duplicados',
        value: resultado.duplicados,
        icon: Copy,
        variant: 'warning',
      }),
      StatCard({
        label: 'Errores',
        value: resultado.errores,
        icon: AlertTriangle,
        variant: 'danger',
      }),
    );
  }

  async function handleAnalizar(): Promise<void> {
    if (!archivoSeleccionado || !formatoSeleccionado) return;
    renderCargando('Analizando archivo...');
    try {
      resultadoAnalisis = await ImportacionesService.analizar(
        entidad,
        formatoSeleccionado,
        archivoSeleccionado,
      );
      renderVistaPrevia();
    } catch (error) {
      renderErrorEnPaso(error, renderSeleccionar);
    }
  }

  function renderVistaPrevia(): void {
    if (!resultadoAnalisis) return;
    const resultado = resultadoAnalisis;

    const content = el(
      'div',
      { className: 'flex flex-col gap-4' },
      buildResumenCards(resultado, 'Validos'),
      resultado.filas.length > 0
        ? DataTable({
            columns: COLUMNAS_FILAS,
            rows: resultado.filas,
            getRowKey: (row) => String(row.fila),
          })
        : el(
            'p',
            { className: 'text-sm text-text-secondary' },
            'Todos los registros son validos y no estan duplicados.',
          ),
    );

    renderStep(content, [
      Button({ label: 'Cancelar', variant: 'secondary', onClick: () => modal.close() }),
      Button({ label: 'Confirmar importacion', onClick: () => void handleConfirmar() }),
    ]);
  }

  async function handleConfirmar(): Promise<void> {
    if (!archivoSeleccionado || !formatoSeleccionado) return;
    const usuario = SessionService.getCurrentUser();
    if (!usuario) {
      renderErrorEnPaso(new Error('No hay una sesion activa.'), renderVistaPrevia);
      return;
    }

    renderCargando('Confirmando importacion...');
    try {
      const resultado = await ImportacionesService.confirmar(
        entidad,
        formatoSeleccionado,
        archivoSeleccionado,
        Number(usuario.id),
      );
      renderResultado(resultado);
    } catch (error) {
      renderErrorEnPaso(error, renderVistaPrevia);
    }
  }

  function renderResultado(resultado: ResultadoImportacion): void {
    const content = el(
      'div',
      { className: 'flex flex-col gap-4' },
      buildResumenCards(resultado, 'Importados'),
      el(
        'p',
        { className: 'text-xs text-text-muted' },
        `Tiempo de procesamiento: ${resultado.tiempoProcesamientoMs} ms.`,
      ),
      resultado.filas.length > 0
        ? DataTable({
            columns: COLUMNAS_FILAS,
            rows: resultado.filas,
            getRowKey: (row) => String(row.fila),
          })
        : null,
    );

    const footerButtons: Node[] = [];
    if (resultado.historialId && (resultado.duplicados > 0 || resultado.errores > 0)) {
      footerButtons.push(
        Button({
          label: 'Descargar reporte de errores',
          variant: 'outline',
          onClick: () => void handleDescargarReporte(resultado.historialId!),
        }),
      );
    }
    footerButtons.push(Button({ label: 'Cerrar', onClick: () => modal.close() }));

    renderStep(content, footerButtons);
  }

  async function handleDescargarReporte(historialId: string): Promise<void> {
    try {
      const archivo = await ImportacionesService.descargarReporteErrores(historialId);
      downloadBlob(archivo.blob, archivo.filename);
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : 'No se pudo descargar el reporte.';
      await infoAlert({ title: 'No se pudo descargar el reporte', text: message, icon: 'error' });
    }
  }

  function renderErrorEnPaso(error: unknown, volver: () => void): void {
    const message =
      error instanceof HttpError ? error.message : 'No se pudo completar la operacion.';
    const content = el(
      'div',
      { className: 'flex flex-col items-center justify-center gap-3 py-10 text-center' },
      el('span', { className: 'text-danger-600 dark-ui:text-danger-400' }, message),
    );
    renderStep(content, [
      Button({ label: 'Volver', variant: 'secondary', onClick: () => volver() }),
    ]);
  }

  renderSeleccionar();

  return modal;
}
