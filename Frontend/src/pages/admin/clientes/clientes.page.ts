import { Eye, Pencil, Plus, Trash2 } from 'lucide';
import { confirmDialog, infoAlert } from '../../../components/alert/alert';
import { Button } from '../../../components/button/button';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import { RowActions } from '../../../components/datatable/row-actions';
import { DetailList } from '../../../components/detail-list/detail-list';
import { FormModal } from '../../../components/modal/form-modal';
import { Modal } from '../../../components/modal/modal';
import { PageHeader } from '../../../components/page-header/page-header';
import { ResourceTable } from '../../../components/resource-table/resource-table';
import { showSuccessToast } from '../../../components/toast/toast';
import { ClientesService } from '../../../services/clientes.service';
import { HttpError } from '../../../services/http/http-error';
import type { Cliente } from '../../../types/cliente';
import { el } from '../../../utils/dom';
import { buildClienteForm } from './cliente-form';

/** Pagina de Clientes: reutiliza integramente la infraestructura CRUD de la Fase 4 (ver usuarios.page.ts). */
export function ClientesPage(): HTMLElement {
  const columns: DataTableColumn<Cliente>[] = [
    { key: 'nombreCompleto', header: 'Nombre completo' },
    { key: 'telefono', header: 'Telefono' },
    { key: 'direccion', header: 'Direccion' },
    {
      key: 'documentoIdentidad',
      header: 'Documento',
      render: (row) => row.documentoIdentidad ?? '—',
    },
    {
      key: 'id',
      header: '',
      className: 'text-right',
      render: (row) =>
        RowActions([
          { label: 'Ver detalle', icon: Eye, onSelect: () => openDetailModal(row) },
          { label: 'Editar', icon: Pencil, onSelect: () => openEditModal(row) },
          { label: 'Eliminar', icon: Trash2, danger: true, onSelect: () => void handleDelete(row) },
        ]),
    },
  ];

  const table = ResourceTable<
    Cliente,
    { nombre: string; telefono: string; documentoIdentidad: string }
  >({
    columns,
    getRowKey: (row) => row.id,
    fetchPage: (params) => ClientesService.listar(params),
    filterFields: [
      { name: 'nombre', placeholder: 'Buscar por nombre...' },
      { name: 'telefono', placeholder: 'Buscar por telefono...' },
      { name: 'documentoIdentidad', placeholder: 'Buscar por documento...' },
    ],
    emptyTitle: 'Sin clientes registrados',
    emptyDescription: 'Crea el primer cliente con el boton "Nuevo cliente".',
  });

  function openDetailModal(cliente: Cliente): void {
    const modal = Modal({
      title: 'Detalle de cliente',
      content: DetailList({
        fields: [
          { label: 'ID', value: cliente.id },
          { label: 'Nombre completo', value: cliente.nombreCompleto },
          { label: 'Telefono', value: cliente.telefono },
          { label: 'Direccion', value: cliente.direccion },
          { label: 'Documento de identidad', value: cliente.documentoIdentidad ?? '—' },
        ],
      }),
      footer: Button({ label: 'Cerrar', variant: 'secondary', onClick: () => modal.close() }),
      onClose: () => modal.destroy(),
    });
    modal.open();
  }

  function openCreateModal(): void {
    const form = buildClienteForm({ mode: 'create' });
    const modal = FormModal({
      title: 'Nuevo cliente',
      content: form.element,
      submitLabel: 'Crear',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;
        try {
          await ClientesService.crear(values);
          showSuccessToast('Cliente creado correctamente');
          table.reload();
          return true;
        } catch (error) {
          await showApiError(error);
          return false;
        }
      },
    });
    modal.open();
  }

  function openEditModal(cliente: Cliente): void {
    const form = buildClienteForm({ mode: 'edit', initial: cliente });
    const modal = FormModal({
      title: 'Editar cliente',
      content: form.element,
      submitLabel: 'Guardar cambios',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;
        try {
          await ClientesService.actualizar(cliente.id, values);
          showSuccessToast('Cliente actualizado correctamente');
          table.reload();
          return true;
        } catch (error) {
          await showApiError(error);
          return false;
        }
      },
    });
    modal.open();
  }

  async function handleDelete(cliente: Cliente): Promise<void> {
    const confirmed = await confirmDialog({
      title: 'Eliminar cliente',
      text: `¿Confirmas eliminar "${cliente.nombreCompleto}"? Esta accion no se puede deshacer.`,
      icon: 'warning',
      danger: true,
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;

    try {
      await ClientesService.eliminar(cliente.id);
      showSuccessToast('Cliente eliminado');
      table.reload();
    } catch (error) {
      await showApiError(error);
    }
  }

  async function showApiError(error: unknown): Promise<void> {
    const message =
      error instanceof HttpError ? error.message : 'No se pudo conectar con el servidor.';
    await infoAlert({ title: 'No se pudo completar la accion', text: message, icon: 'error' });
  }

  return el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Clientes',
      description: 'Gestiona los clientes que realizan pedidos.',
      breadcrumb: [{ label: 'Clientes' }],
      actions: Button({ label: 'Nuevo cliente', icon: Plus, onClick: openCreateModal }),
    }),
    table.element,
  );
}
