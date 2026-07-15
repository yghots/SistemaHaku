import { Eye, Pencil, Plus, Trash2 } from 'lucide';
import { confirmDialog, infoAlert } from '../../../components/alert/alert';
import { Badge } from '../../../components/badge/badge';
import { Button } from '../../../components/button/button';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import { RowActions } from '../../../components/datatable/row-actions';
import { DetailList } from '../../../components/detail-list/detail-list';
import { Loader } from '../../../components/loader/loader';
import { FormModal } from '../../../components/modal/form-modal';
import { Modal } from '../../../components/modal/modal';
import { PageHeader } from '../../../components/page-header/page-header';
import {
  ResourceTable,
  type ResourceTableHandle,
} from '../../../components/resource-table/resource-table';
import type { SelectOption } from '../../../components/select/select';
import { showSuccessToast } from '../../../components/toast/toast';
import { HttpError } from '../../../services/http/http-error';
import { SucursalesService } from '../../../services/sucursales.service';
import { TiendasService } from '../../../services/tiendas.service';
import type { Sucursal } from '../../../types/sucursal';
import { el } from '../../../utils/dom';
import { formatOptional } from '../../../utils/format-optional';
import { buildSucursalForm } from './sucursal-form';

/** Pagina de Sucursales: reutiliza la misma infraestructura CRUD que Tiendas (ver tiendas.page.ts). */
export function SucursalesPage(): HTMLElement {
  const initialTiendaId = new URLSearchParams(window.location.search).get('tiendaId') ?? undefined;

  let tiendaOptions: SelectOption[] = [];
  let tiendaNameById = new Map<string, string>();
  let table: ResourceTableHandle | undefined;

  const newButton = Button({
    label: 'Nueva sucursal',
    icon: Plus,
    disabled: true,
    onClick: () => openCreateModal(),
  });

  const tableSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando tiendas' }),
  );

  const container = el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Sucursales',
      description: 'Gestiona los puntos de atencion de cada tienda.',
      breadcrumb: [{ label: 'Sucursales' }],
      actions: newButton,
    }),
    tableSlot,
  );

  void init();

  async function init(): Promise<void> {
    try {
      const response = await TiendasService.listar({ page: 1, limit: 100 });
      tiendaOptions = response.data.map((tienda) => ({ value: tienda.id, label: tienda.nombre }));
      tiendaNameById = new Map(response.data.map((tienda) => [tienda.id, tienda.nombre]));
      newButton.disabled = false;
      buildTable();
    } catch (error) {
      await showApiError(error);
      tableSlot.replaceChildren(
        el(
          'p',
          { className: 'py-10 text-center text-sm text-danger-600' },
          'No se pudo cargar la lista de tiendas.',
        ),
      );
    }
  }

  function buildTable(): void {
    const columns: DataTableColumn<Sucursal>[] = [
      { key: 'nombre', header: 'Nombre' },
      {
        key: 'tiendaId',
        header: 'Tienda',
        render: (row) => tiendaNameById.get(row.tiendaId) ?? row.tiendaId,
      },
      { key: 'direccion', header: 'Direccion' },
      { key: 'telefono', header: 'Telefono' },
      {
        key: 'esPrincipal',
        header: 'Principal',
        render: (row) =>
          row.esPrincipal
            ? Badge({ label: 'Principal', variant: 'success' })
            : Badge({ label: 'Secundaria', variant: 'neutral' }),
      },
      {
        key: 'id',
        header: '',
        className: 'text-right',
        render: (row) =>
          RowActions([
            { label: 'Ver detalle', icon: Eye, onSelect: () => openDetailModal(row) },
            { label: 'Editar', icon: Pencil, onSelect: () => openEditModal(row) },
            {
              label: 'Eliminar',
              icon: Trash2,
              danger: true,
              onSelect: () => void handleDelete(row),
            },
          ]),
      },
    ];

    table = ResourceTable<Sucursal, { tiendaId: string; nombre: string }>({
      columns,
      getRowKey: (row) => row.id,
      fetchPage: (params) =>
        SucursalesService.listar({
          page: params.page,
          limit: params.limit,
          nombre: params.nombre,
          tiendaId: params.tiendaId ? Number(params.tiendaId) : undefined,
        }),
      filterFields: [
        {
          type: 'select',
          name: 'tiendaId',
          placeholder: 'Todas las tiendas',
          options: tiendaOptions,
          initialValue: initialTiendaId,
        },
        { name: 'nombre', placeholder: 'Buscar por nombre...' },
      ],
      emptyTitle: 'Sin sucursales registradas',
      emptyDescription: 'Crea la primera sucursal con el boton "Nueva sucursal".',
    });

    tableSlot.replaceChildren(table.element);
  }

  function tiendaLabel(tiendaId: string): string {
    return tiendaNameById.get(tiendaId) ?? tiendaId;
  }

  function openDetailModal(sucursal: Sucursal): void {
    const modal = Modal({
      title: 'Detalle de sucursal',
      content: DetailList({
        fields: [
          { label: 'ID', value: sucursal.id },
          { label: 'Tienda', value: tiendaLabel(sucursal.tiendaId) },
          { label: 'Nombre', value: sucursal.nombre },
          { label: 'Direccion', value: sucursal.direccion },
          { label: 'Referencia', value: formatOptional(sucursal.referencia) },
          { label: 'Telefono', value: sucursal.telefono },
          { label: 'Principal', value: sucursal.esPrincipal ? 'Si' : 'No' },
        ],
      }),
      footer: Button({ label: 'Cerrar', variant: 'secondary', onClick: () => modal.close() }),
      onClose: () => modal.destroy(),
    });
    modal.open();
  }

  function openCreateModal(): void {
    const form = buildSucursalForm({ mode: 'create', tiendaOptions });
    const modal = FormModal({
      title: 'Nueva sucursal',
      content: form.element,
      submitLabel: 'Crear',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;
        try {
          await SucursalesService.crear(values);
          showSuccessToast('Sucursal creada correctamente');
          table?.reload();
          return true;
        } catch (error) {
          await showApiError(error);
          return false;
        }
      },
    });
    modal.open();
  }

  function openEditModal(sucursal: Sucursal): void {
    const form = buildSucursalForm({ mode: 'edit', initial: sucursal, tiendaOptions });
    const modal = FormModal({
      title: 'Editar sucursal',
      content: form.element,
      submitLabel: 'Guardar cambios',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;
        try {
          await SucursalesService.actualizar(sucursal.id, values);
          showSuccessToast('Sucursal actualizada correctamente');
          table?.reload();
          return true;
        } catch (error) {
          await showApiError(error);
          return false;
        }
      },
    });
    modal.open();
  }

  async function handleDelete(sucursal: Sucursal): Promise<void> {
    const confirmed = await confirmDialog({
      title: 'Eliminar sucursal',
      text: `¿Confirmas eliminar "${sucursal.nombre}"? Esta accion no se puede deshacer.`,
      icon: 'warning',
      danger: true,
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;

    try {
      await SucursalesService.eliminar(sucursal.id);
      showSuccessToast('Sucursal eliminada');
      table?.reload();
    } catch (error) {
      await showApiError(error);
    }
  }

  async function showApiError(error: unknown): Promise<void> {
    const message =
      error instanceof HttpError ? error.message : 'No se pudo conectar con el servidor.';
    await infoAlert({ title: 'No se pudo completar la accion', text: message, icon: 'error' });
  }

  return container;
}
