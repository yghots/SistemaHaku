import { Eye, Pencil, Plus, Trash2, UserCheck, UserX } from 'lucide';
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
import { ROL_USUARIO_BADGE_VARIANT, ROL_USUARIO_LABEL } from '../../../constants/rol-usuario';
import { UsuariosService } from '../../../services/usuarios.service';
import { HttpError } from '../../../services/http/http-error';
import type { ListUsuariosParams, Usuario } from '../../../types/usuario';
import { el } from '../../../utils/dom';
import { nombreCompleto } from '../../../utils/nombre-completo';
import { buildUsuarioForm } from './usuario-form';

// Fase 25: opciones del filtro por rol, misma convencion que ESTADO_OPTIONS
// en pedidos.page.ts (Object.entries sobre el mapa de etiquetas ya existente).
const ROL_OPTIONS = Object.entries(ROL_USUARIO_LABEL).map(([value, label]) => ({
  value,
  label,
}));

/** Pagina de referencia para todos los modulos administrativos (CRUD completo sobre /usuarios). */
export function UsuariosPage(): HTMLElement {
  const columns: DataTableColumn<Usuario>[] = [
    {
      key: 'nombres',
      header: 'Nombre completo',
      render: (row) => nombreCompleto(row),
    },
    { key: 'usuario', header: 'Usuario' },
    { key: 'correo', header: 'Correo' },
    {
      key: 'rol',
      header: 'Rol',
      render: (row) =>
        Badge({
          label: ROL_USUARIO_LABEL[row.rol],
          variant: ROL_USUARIO_BADGE_VARIANT[row.rol],
        }),
    },
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
          {
            label: 'Eliminar',
            icon: Trash2,
            danger: true,
            onSelect: () => void handleDelete(row),
          },
        ]),
    },
  ];

  const table = ResourceTable<Usuario, Omit<ListUsuariosParams, 'page' | 'limit'>>({
    columns,
    getRowKey: (row) => row.id,
    fetchPage: (params) => UsuariosService.listar(params),
    filterFields: [
      { name: 'usuario', placeholder: 'Buscar por usuario...' },
      { name: 'correo', placeholder: 'Buscar por correo...' },
      { type: 'select', name: 'rol', placeholder: 'Todos los roles', options: ROL_OPTIONS },
    ],
    emptyTitle: 'Sin usuarios registrados',
    emptyDescription: 'Crea el primer usuario con el boton "Nuevo usuario".',
  });

  function openDetailModal(usuario: Usuario): void {
    const modal = Modal({
      title: 'Detalle de usuario',
      content: DetailList({
        fields: [
          { label: 'ID', value: usuario.id },
          { label: 'Nombres', value: usuario.nombres },
          { label: 'Apellidos', value: usuario.apellidos },
          { label: 'Usuario', value: usuario.usuario },
          { label: 'Correo', value: usuario.correo },
          { label: 'Rol', value: ROL_USUARIO_LABEL[usuario.rol] },
          { label: 'Estado', value: usuario.activo ? 'Activo' : 'Inactivo' },
        ],
      }),
      footer: Button({ label: 'Cerrar', variant: 'secondary', onClick: () => modal.close() }),
      onClose: () => modal.destroy(),
    });
    modal.open();
  }

  function openCreateModal(): void {
    const form = buildUsuarioForm({ mode: 'create' });
    const modal = FormModal({
      title: 'Nuevo usuario',
      content: form.element,
      submitLabel: 'Crear',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;
        try {
          await UsuariosService.crear({
            nombres: values.nombres,
            apellidos: values.apellidos,
            usuario: values.usuario,
            correo: values.correo,
            password: values.password,
            rol: values.rol,
          });
          showSuccessToast('Usuario creado correctamente');
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

  function openEditModal(usuario: Usuario): void {
    const form = buildUsuarioForm({ mode: 'edit', initial: usuario });
    const modal = FormModal({
      title: 'Editar usuario',
      content: form.element,
      submitLabel: 'Guardar cambios',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;
        try {
          await UsuariosService.actualizar(usuario.id, {
            nombres: values.nombres,
            apellidos: values.apellidos,
            usuario: values.usuario,
            correo: values.correo,
            rol: values.rol,
            ...(values.password ? { password: values.password } : {}),
          });
          showSuccessToast('Usuario actualizado correctamente');
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

  async function handleToggleActive(usuario: Usuario, activate: boolean): Promise<void> {
    const confirmed = await confirmDialog({
      title: activate ? 'Activar usuario' : 'Desactivar usuario',
      text: `¿Confirmas ${activate ? 'activar' : 'desactivar'} a "${nombreCompleto(usuario)}"?`,
      icon: 'question',
    });
    if (!confirmed) return;

    try {
      if (activate) {
        await UsuariosService.activar(usuario.id);
      } else {
        await UsuariosService.desactivar(usuario.id);
      }
      showSuccessToast(activate ? 'Usuario activado' : 'Usuario desactivado');
      table.reload();
    } catch (error) {
      await showApiError(error);
    }
  }

  async function handleDelete(usuario: Usuario): Promise<void> {
    const confirmed = await confirmDialog({
      title: 'Eliminar usuario',
      text: `¿Confirmas eliminar a "${nombreCompleto(usuario)}"? Esta accion no se puede deshacer.`,
      icon: 'warning',
      danger: true,
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;

    try {
      await UsuariosService.eliminar(usuario.id);
      showSuccessToast('Usuario eliminado');
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
      title: 'Usuarios',
      description: 'Gestiona las cuentas de acceso al sistema.',
      breadcrumb: [{ label: 'Usuarios' }],
      actions: Button({ label: 'Nuevo usuario', icon: Plus, onClick: openCreateModal }),
    }),
    table.element,
  );
}
