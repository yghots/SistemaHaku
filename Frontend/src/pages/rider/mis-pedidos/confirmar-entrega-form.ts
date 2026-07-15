import { Plus, Trash2 } from 'lucide';
import { Checkbox } from '../../../components/checkbox/checkbox';
import { IconButton } from '../../../components/button/icon-button';
import { Button } from '../../../components/button/button';
import { DataTable, type DataTableColumn } from '../../../components/datatable/datatable';
import { DetailList } from '../../../components/detail-list/detail-list';
import { Loader } from '../../../components/loader/loader';
import {
  PhotoCapture,
  type PhotoCaptureHandle,
} from '../../../components/photo-capture/photo-capture';
import { Section } from '../../../components/section/section';
import { Textarea } from '../../../components/textarea/textarea';
import type { ResumenPagoPedido } from '../../../types/pago';
import type { Pedido } from '../../../types/pedido';
import { cn } from '../../../utils/cn';
import { el } from '../../../utils/dom';
import { formatMonto } from '../../../utils/format-monto';
import { formatOptional } from '../../../utils/format-optional';
import {
  buildPagoForm,
  METODO_PAGO_LABEL,
  type PagoFormValues,
} from '../../admin/pedidos/pedido-pago-form';

export interface ConfirmarEntregaFormValues {
  fotos: File[];
  fotoPrincipalIndex?: number;
  observaciones?: string;
}

export interface TempPago extends PagoFormValues {
  tempId: number;
}

export interface ConfirmarEntregaFormHandle {
  element: HTMLElement;
  validate: () => ConfirmarEntregaFormValues | null;
  /** Reemplaza el placeholder de carga por el resumen economico ya calculado por el backend (Fase 20.1) — nunca recalculado aqui. */
  setResumen: (resumen: ResumenPagoPedido) => void;
  /** Snapshot de los pagos agregados en memoria que todavia no se registraron contra el backend. */
  getPagosPendientes: () => TempPago[];
  /** Quita un pago de la lista pendiente apenas se registra con exito, para que un reintento nunca lo vuelva a enviar duplicado. */
  marcarPagoRegistrado: (tempId: number) => void;
}

interface FotoRow {
  rowEl: HTMLElement;
  photo: PhotoCaptureHandle;
  principalCheckbox: ReturnType<typeof Checkbox>;
}

/**
 * Formulario de "Confirmar entrega" (CU10, corregido en la Fase 20.1): el
 * cobro al cliente ocurre en el momento de la entrega, asi que el registro
 * de pagos se movio aqui desde el panel Administrador (que ya no registra
 * pagos, solo consulta). Orden del formulario: Fotos → Observacion →
 * Resumen economico → Pagos → Confirmar entrega (el boton de envio vive en
 * el FormModal que envuelve este formulario, en `mis-pedidos.page.ts`).
 *
 * Los pagos se arman en memoria (mismo patron de "sub-recurso antes de que
 * el padre exista" documentado en `CLAUDE.md` §27) y se registran uno por
 * uno contra el endpoint ya existente, reutilizando `buildPagoForm()` tal
 * cual (Fase 20) — nunca un formulario nuevo. La pagina (no este archivo)
 * es quien llama a `PedidosService.registrarPago`/`confirmarEntrega`; este
 * formulario solo expone `getPagosPendientes`/`marcarPagoRegistrado` para
 * que la pagina pueda ir vaciando la lista a medida que cada pago se
 * confirma, sin volver a enviar un pago ya registrado si algo falla a
 * mitad de camino.
 */
export function buildConfirmarEntregaForm(pedido: Pedido): ConfirmarEntregaFormHandle {
  const rows: FotoRow[] = [];
  const rowsContainer = el('div', { className: 'flex flex-col gap-3' });

  const fotosErrorText = el('p', { className: cn('text-sm text-danger-600', 'hidden') }, '');

  function setFotosError(message: string | undefined): void {
    fotosErrorText.textContent = message ?? '';
    fotosErrorText.classList.toggle('hidden', !message);
  }

  /**
   * "Principal" se comporta como un radio (solo una foto puede serlo, el
   * backend recibe un unico `fotoPrincipalIndex`, Fase 22): no existe un
   * componente Radio en el catalogo del proyecto, asi que la exclusividad
   * se resuelve a mano con el `Checkbox` ya existente — marcar uno
   * desmarca todos los demas.
   */
  function addRow(): void {
    const removeButton = IconButton({
      icon: Trash2,
      label: 'Quitar foto',
      variant: 'ghost',
      size: 'sm',
      onClick: () => removeRow(rowEl),
    });

    const photo = PhotoCapture({
      label: rows.length === 0 ? 'Tomar foto de entrega' : 'Tomar otra foto',
    });

    const principalCheckbox = Checkbox({
      name: `fotoPrincipal-${rows.length}`,
      label: 'Principal',
      onChange: (checked) => {
        if (!checked) return;
        for (const otherRow of rows) {
          if (otherRow.principalCheckbox.checkbox !== principalCheckbox.checkbox) {
            otherRow.principalCheckbox.checkbox.checked = false;
          }
        }
      },
    });

    const rowEl = el(
      'div',
      { className: 'flex flex-wrap items-end gap-3 border-b border-border-default pb-4' },
      el('div', { className: 'min-w-0 flex-1 basis-full sm:basis-auto' }, photo.element),
      el('div', { className: 'flex items-end gap-1' }, principalCheckbox.wrapper, removeButton),
    );

    rows.push({ rowEl, photo, principalCheckbox });
    rowsContainer.appendChild(rowEl);
  }

  function removeRow(rowEl: HTMLElement): void {
    if (rows.length <= 1) return;
    const index = rows.findIndex((row) => row.rowEl === rowEl);
    if (index === -1) return;
    rows[index]!.photo.dispose();
    rows.splice(index, 1);
    rowEl.remove();
  }

  addRow();

  const addButton = Button({
    label: 'Agregar otra foto',
    icon: Plus,
    variant: 'outline',
    size: 'sm',
    onClick: () => addRow(),
  });

  const observacionesField = Textarea({
    name: 'observaciones',
    label: 'Observaciones',
    helpText: 'Opcional',
  });

  // Resumen economico (Fase 20.1): placeholder mientras la pagina consulta
  // `PedidosService.obtenerResumenPagos` — el modal se abre de inmediato,
  // sin esperar esta consulta (mismo patron que "Ver detalle").
  const resumenSlot = el(
    'div',
    { className: 'flex justify-center py-4' },
    Loader({ label: 'Cargando resumen' }),
  );

  function setResumen(resumen: ResumenPagoPedido): void {
    resumenSlot.replaceChildren(
      DetailList({
        fields: [
          { label: 'Valor del producto', value: formatMonto(pedido.valorProducto) },
          { label: 'Costo de envio', value: formatMonto(pedido.costoEnvio) },
          { label: 'Total del pedido', value: formatMonto(resumen.totalPedido) },
          { label: 'Total pagado', value: formatMonto(resumen.totalPagado) },
          { label: 'Saldo pendiente', value: formatMonto(resumen.saldoPendiente) },
        ],
      }),
    );
  }

  // Pagos (Fase 20.1): se arman en memoria y se registran secuencialmente
  // desde `mis-pedidos.page.ts` al confirmar la entrega — nunca desde aqui
  // (los formularios no llaman servicios de mutacion, solo la pagina).
  let tempPagos: TempPago[] = [];
  let nextTempId = 1;
  let pagoForm = buildPagoForm();

  const pagoFormContainer = el('div', { className: 'flex flex-col gap-4' }, pagoForm.element);
  const pagosTableSlot = el('div', {});

  function resetPagoForm(): void {
    pagoForm = buildPagoForm();
    pagoFormContainer.replaceChildren(pagoForm.element);
  }

  function renderPagosTable(): void {
    const columns: DataTableColumn<TempPago>[] = [
      { key: 'metodoPago', header: 'Metodo', render: (row) => METODO_PAGO_LABEL[row.metodoPago] },
      { key: 'monto', header: 'Monto', render: (row) => formatMonto(row.monto) },
      {
        key: 'observacion',
        header: 'Observacion',
        render: (row) => formatOptional(row.observacion),
      },
      {
        key: 'tempId',
        header: '',
        className: 'text-right',
        render: (row) =>
          IconButton({
            icon: Trash2,
            label: 'Quitar pago',
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              tempPagos = tempPagos.filter((pago) => pago.tempId !== row.tempId);
              renderPagosTable();
            },
          }),
      },
    ];

    pagosTableSlot.replaceChildren(
      DataTable({
        columns,
        rows: tempPagos,
        getRowKey: (row) => row.tempId.toString(),
        emptyTitle: 'Sin pagos agregados',
        emptyDescription: 'Registra el cobro al cliente antes de confirmar la entrega (opcional).',
      }),
    );
  }
  renderPagosTable();

  const addPagoButton = Button({
    label: 'Agregar pago',
    icon: Plus,
    variant: 'outline',
    size: 'sm',
    onClick: () => {
      const values = pagoForm.validate();
      if (!values) return;
      tempPagos = [...tempPagos, { ...values, tempId: nextTempId++ }];
      resetPagoForm();
      renderPagosTable();
    },
  });

  const element = el(
    'div',
    { className: 'flex flex-col gap-6' },
    Section({
      title: 'Fotos',
      children: [rowsContainer, addButton, fotosErrorText],
    }),
    Section({ title: 'Observacion', children: [observacionesField.wrapper] }),
    Section({ title: 'Resumen economico', children: [resumenSlot] }),
    Section({
      title: 'Pagos',
      description: 'Opcional: registra el cobro al cliente en el momento de la entrega.',
      children: [pagoFormContainer, addPagoButton, pagosTableSlot],
    }),
  );

  function validate(): ConfirmarEntregaFormValues | null {
    setFotosError(undefined);
    observacionesField.setError(undefined);

    const fotos: File[] = [];
    let fotoPrincipalIndex: number | undefined;
    for (const row of rows) {
      const archivo = row.photo.getFile();
      if (!archivo) continue;
      if (row.principalCheckbox.checkbox.checked) {
        fotoPrincipalIndex = fotos.length;
      }
      fotos.push(archivo);
    }

    if (fotos.length === 0) {
      setFotosError('Toma o selecciona al menos una fotografia');
      return null;
    }

    const observaciones = observacionesField.textarea.value.trim();
    if (observaciones.length > 500) {
      observacionesField.setError('Maximo 500 caracteres');
      return null;
    }

    return { fotos, fotoPrincipalIndex, observaciones: observaciones || undefined };
  }

  function getPagosPendientes(): TempPago[] {
    return [...tempPagos];
  }

  function marcarPagoRegistrado(tempId: number): void {
    tempPagos = tempPagos.filter((pago) => pago.tempId !== tempId);
    renderPagosTable();
  }

  return { element, validate, setResumen, getPagosPendientes, marcarPagoRegistrado };
}
