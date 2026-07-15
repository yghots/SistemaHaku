import dayjs from 'dayjs';
import { AlertTriangle, CheckCircle2, Copy, Eye, FileWarning } from 'lucide';
import { infoAlert } from '../../../components/alert/alert';
import { Badge } from '../../../components/badge/badge';
import { Button } from '../../../components/button/button';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import { DataTable } from '../../../components/datatable/datatable';
import { RowActions } from '../../../components/datatable/row-actions';
import { Loader } from '../../../components/loader/loader';
import { Modal, type ModalHandle } from '../../../components/modal/modal';
import { ResourceTable } from '../../../components/resource-table/resource-table';
import { StatCard } from '../../../components/stat-card/stat-card';
import { HttpError } from '../../../services/http/http-error';
import { ImportacionesService } from '../../../services/importaciones.service';
import type {
  ImportacionHistorialDetalle,
  ImportacionHistorialItem,
  ResultadoFilaImportacion,
} from '../../../types/importacion';
import { downloadBlob } from '../../../utils/download-file';
import { el } from '../../../utils/dom';
import type { EntidadImportacionConfig } from './entidad-importacion.config';

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
  { key: 'campo', header: 'Campo', render: (row) => row.campo ?? '—' },
  { key: 'valor', header: 'Valor', render: (row) => row.valor ?? '—' },
];

/**
 * Historial de importaciones de una entidad (Fase 19): listado paginado
 * (reutiliza `ResourceTable`) con "Ver detalle" por fila, que reemplaza el
 * contenido del mismo Modal (nunca anida un segundo Modal) por la vista de
 * detalle — con el desglose de filas y la descarga del reporte de errores.
 */
export function HistorialModal(config: EntidadImportacionConfig): ModalHandle {
  const stepContainer = el('div', {});
  const footerContainer = el('div', { className: 'flex justify-end gap-3' });

  const modal = Modal({
    title: `Historial — ${config.nombre}`,
    content: stepContainer,
    footer: footerContainer,
    size: 'xl',
    onClose: () => modal.destroy(),
  });

  function renderStep(content: Node, footerButtons: Node[]): void {
    stepContainer.replaceChildren(content);
    footerContainer.replaceChildren(...footerButtons);
  }

  const columnasHistorial: DataTableColumn<ImportacionHistorialItem>[] = [
    {
      key: 'creadoEn',
      header: 'Fecha',
      render: (row) => dayjs(row.creadoEn).format('DD/MM/YYYY HH:mm'),
    },
    { key: 'usuarioNombre', header: 'Usuario' },
    { key: 'archivoNombre', header: 'Archivo' },
    { key: 'formato', header: 'Formato', render: (row) => row.formato.toUpperCase() },
    { key: 'totalEncontrados', header: 'Encontrados' },
    { key: 'importados', header: 'Importados' },
    { key: 'duplicados', header: 'Duplicados' },
    { key: 'errores', header: 'Errores' },
    {
      key: 'tiempoProcesamientoMs',
      header: 'Tiempo',
      render: (row) => `${row.tiempoProcesamientoMs} ms`,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) =>
        Badge({
          label: row.estado === 'completado' ? 'Completado' : 'Parcial',
          variant: row.estado === 'completado' ? 'success' : 'warning',
        }),
    },
    {
      key: 'id',
      header: '',
      render: (row) =>
        RowActions([
          { label: 'Ver detalle', icon: Eye, onSelect: () => void abrirDetalle(row.id) },
        ]),
    },
  ];

  function renderLista(): void {
    const table = ResourceTable({
      columns: columnasHistorial,
      getRowKey: (row) => row.id,
      fetchPage: (params) =>
        ImportacionesService.listarHistorial({
          page: params.page,
          limit: params.limit,
          entidad: config.entidad,
        }),
      emptyTitle: 'Sin importaciones',
      emptyDescription: 'Todavia no se ha confirmado ninguna importacion de esta entidad.',
    });

    renderStep(table.element, [
      Button({ label: 'Cerrar', variant: 'secondary', onClick: () => modal.close() }),
    ]);
  }

  async function abrirDetalle(id: string): Promise<void> {
    renderStep(
      el(
        'div',
        { className: 'flex flex-col items-center justify-center gap-3 py-10' },
        Loader({ size: 32 }),
      ),
      [],
    );
    try {
      const detalle = await ImportacionesService.obtenerHistorialDetalle(id);
      renderDetalle(detalle);
    } catch (error) {
      const message = error instanceof HttpError ? error.message : 'No se pudo cargar el detalle.';
      await infoAlert({ title: 'No se pudo cargar el detalle', text: message, icon: 'error' });
      renderLista();
    }
  }

  function renderDetalle(detalle: ImportacionHistorialDetalle): void {
    const content = el(
      'div',
      { className: 'flex flex-col gap-4' },
      el(
        'div',
        { className: 'grid grid-cols-1 gap-4 sm:grid-cols-2' },
        el(
          'div',
          { className: 'flex flex-col gap-1' },
          el('span', { className: 'text-xs font-medium uppercase text-text-muted' }, 'Archivo'),
          el('span', { className: 'text-sm text-text-primary' }, detalle.archivoNombre),
        ),
        el(
          'div',
          { className: 'flex flex-col gap-1' },
          el('span', { className: 'text-xs font-medium uppercase text-text-muted' }, 'Usuario'),
          el('span', { className: 'text-sm text-text-primary' }, detalle.usuarioNombre),
        ),
      ),
      el(
        'div',
        { className: 'grid grid-cols-2 gap-4 sm:grid-cols-4' },
        StatCard({
          label: 'Encontrados',
          value: detalle.totalEncontrados,
          icon: FileWarning,
          variant: 'neutral',
        }),
        StatCard({
          label: 'Importados',
          value: detalle.importados,
          icon: CheckCircle2,
          variant: 'success',
        }),
        StatCard({
          label: 'Duplicados',
          value: detalle.duplicados,
          icon: Copy,
          variant: 'warning',
        }),
        StatCard({
          label: 'Errores',
          value: detalle.errores,
          icon: AlertTriangle,
          variant: 'danger',
        }),
      ),
      detalle.filas.length > 0
        ? DataTable({
            columns: COLUMNAS_FILAS,
            rows: detalle.filas,
            getRowKey: (row) => String(row.fila),
          })
        : el(
            'p',
            { className: 'text-sm text-text-secondary' },
            'Todos los registros se importaron correctamente.',
          ),
    );

    const footerButtons: Node[] = [
      Button({ label: 'Volver', variant: 'secondary', onClick: () => renderLista() }),
    ];
    if (detalle.duplicados > 0 || detalle.errores > 0) {
      footerButtons.push(
        Button({
          label: 'Descargar reporte de errores',
          onClick: () => void handleDescargarReporte(detalle.id),
        }),
      );
    }

    renderStep(content, footerButtons);
  }

  async function handleDescargarReporte(id: string): Promise<void> {
    try {
      const archivo = await ImportacionesService.descargarReporteErrores(id);
      downloadBlob(archivo.blob, archivo.filename);
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : 'No se pudo descargar el reporte.';
      await infoAlert({ title: 'No se pudo descargar el reporte', text: message, icon: 'error' });
    }
  }

  renderLista();

  return modal;
}
