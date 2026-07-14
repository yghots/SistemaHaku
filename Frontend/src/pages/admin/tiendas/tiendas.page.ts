import { Building2, Eye, Pencil, Plus, Trash2, UserCheck, UserX } from 'lucide';
import { confirmDialog, infoAlert } from '../../../components/alert/alert';
import { Badge } from '../../../components/badge/badge';
import { Button } from '../../../components/button/button';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import { RowActions } from '../../../components/datatable/row-actions';
import { DetailList } from '../../../components/detail-list/detail-list';
import { FormModal } from '../../../components/modal/form-modal';
import { Modal } from '../../../components/modal/modal';
import { PageHeader } from '../../../components/page-header/page-header';
import { ResourceTable } from '../../../components/resource-table/resource-table';
import { showSuccessToast } from '../../../components/toast/toast';
import { HttpError } from '../../../services/http/http-error';
import { TiendasService } from '../../../services/tiendas.service';
import type { Tienda } from '../../../types/tienda';
import { el } from '../../../utils/dom';
import { buildTiendaForm } from './tienda-form';

/** Pagina de Tiendas: reutiliza integramente la infraestructura CRUD de la Fase 4 (ver usuarios.page.ts). */
export function TiendasPage(): HTMLElement {
  const columns: DataTableColumn<Tienda>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'ruc', header: 'RUC', render: (row) => row.ruc ?? '—' },
    {
      key: 'activo',
      header: 'Estado',
      render: (row) =>
        Badge({
          label: row.activo ? 'Activo' : 'Inactivo',
          variant: row.activo ? 'success' : 'neutral',
        }),
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
            label: 'Ver sucursales',
            icon: Building2,
            href: `/admin/sucursales?tiendaId=${row.id}`,
          },
          {
            label: 'Activar',
            icon: UserCheck,
            hidden: row.activo,
            onSelect: () => void handleToggleActive(row, true),
          },
          {
            label: 'Desactivar',
            icon: UserX,
            hidden: !row.activo,
            onSelect: () => void handleToggleActive(row, false),
          },
          { label: 'Eliminar', icon: Trash2, danger: true, onSelect: () => void handleDelete(row) },
        ]),
    },
  ];

  const table = ResourceTable<Tienda, { nombre: string }>({
    columns,
    getRowKey: (row) => row.id,
    fetchPage: (params) => TiendasService.listar(params),
    filterFields: [{ name: 'nombre', placeholder: 'Buscar por nombre...' }],
    emptyTitle: 'Sin tiendas registradas',
    emptyDescription: 'Crea la primera tienda con el boton "Nueva tienda".',
  });

  function openDetailModal(tienda: Tienda): void {
    const modal = Modal({
      title: 'Detalle de tienda',
      content: DetailList({
        fields: [
          { label: 'ID', value: tienda.id },
          { label: 'Nombre', value: tienda.nombre },
          { label: 'RUC', value: tienda.ruc ?? '—' },
          { label: 'Estado', value: tienda.activo ? 'Activo' : 'Inactivo' },
        ],
      }),
      footer: Button({ label: 'Cerrar', variant: 'secondary', onClick: () => modal.close() }),
      onClose: () => modal.destroy(),
    });
    modal.open();
  }

  function openCreateModal(): void {
    const form = buildTiendaForm({ mode: 'create' });
    const modal = FormModal({
      title: 'Nueva tienda',
      content: form.element,
      submitLabel: 'Crear',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;
        try {
          await TiendasService.crear(values);
          showSuccessToast('Tienda creada correctamente');
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

  function openEditModal(tienda: Tienda): void {
    const form = buildTiendaForm({ mode: 'edit', initial: tienda });
    const modal = FormModal({
      title: 'Editar tienda',
      content: form.element,
      submitLabel: 'Guardar cambios',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;
        try {
          await TiendasService.actualizar(tienda.id, values);
          showSuccessToast('Tienda actualizada correctamente');
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

  async function handleToggleActive(tienda: Tienda, activate: boolean): Promise<void> {
    const confirmed = await confirmDialog({
      title: activate ? 'Activar tienda' : 'Desactivar tienda',
      text: `¿Confirmas ${activate ? 'activar' : 'desactivar'} "${tienda.nombre}"?`,
      icon: 'question',
    });
    if (!confirmed) return;

    try {
      if (activate) {
        await TiendasService.activar(tienda.id);
      } else {
        await TiendasService.desactivar(tienda.id);
      }
      showSuccessToast(activate ? 'Tienda activada' : 'Tienda desactivada');
      table.reload();
    } catch (error) {
      await showApiError(error);
    }
  }

  async function handleDelete(tienda: Tienda): Promise<void> {
    const confirmed = await confirmDialog({
      title: 'Eliminar tienda',
      text: `¿Confirmas eliminar "${tienda.nombre}"? Esta accion no se puede deshacer.`,
      icon: 'warning',
      danger: true,
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;

    try {
      await TiendasService.eliminar(tienda.id);
      showSuccessToast('Tienda eliminada');
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
      title: 'Tiendas',
      description: 'Gestiona los negocios que solicitan el servicio de courier.',
      breadcrumb: [{ label: 'Tiendas' }],
      actions: Button({ label: 'Nueva tienda', icon: Plus, onClick: openCreateModal }),
    }),
    table.element,
  );
}
