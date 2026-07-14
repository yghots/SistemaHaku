import { Eye, Pencil, Plus, Trash2 } from 'lucide';
import { confirmDialog, infoAlert } from '../../../components/alert/alert';
import { Badge, type BadgeVariant } from '../../../components/badge/badge';
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
import { MotorizadosService } from '../../../services/motorizados.service';
import { UsuariosService } from '../../../services/usuarios.service';
import type { EstadoMotorizado, PerfilMotorizado } from '../../../types/perfil-motorizado';
import { el } from '../../../utils/dom';
import { toSelectOptions } from '../../../utils/select-options';
import { buildMotorizadoForm } from './motorizado-form';

const ESTADO_BADGE_VARIANT: Record<EstadoMotorizado, BadgeVariant> = {
  disponible: 'success',
  ocupado: 'warning',
  inactivo: 'neutral',
};

const ESTADO_LABEL: Record<EstadoMotorizado, string> = {
  disponible: 'Disponible',
  ocupado: 'Ocupado',
  inactivo: 'Inactivo',
};

/** Pagina de Motorizados: reutiliza la misma infraestructura CRUD que Tiendas/Sucursales/Clientes. */
export function MotorizadosPage(): HTMLElement {
  let usuarioOptions: SelectOption[] = [];
  let usuarioLabelById = new Map<string, string>();
  let table: ResourceTableHandle | undefined;

  const newButton = Button({
    label: 'Nuevo perfil',
    icon: Plus,
    disabled: true,
    onClick: () => openCreateModal(),
  });

  const tableSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando usuarios' }),
  );

  const container = el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Motorizados',
      description: 'Gestiona los perfiles operativos de los usuarios con rol motorizado.',
      breadcrumb: [{ label: 'Motorizados' }],
      actions: newButton,
    }),
    tableSlot,
  );

  void init();

  async function init(): Promise<void> {
    try {
      const response = await UsuariosService.listar({ page: 1, limit: 100 });
      const motorizados = response.data.filter((usuario) => usuario.rol === 'motorizado');
      usuarioOptions = toSelectOptions(
        motorizados,
        (usuario) => usuario.id,
        (usuario) => `${usuario.usuario} — ${usuario.correo}`,
      );
      usuarioLabelById = new Map(motorizados.map((usuario) => [usuario.id, usuario.usuario]));
      newButton.disabled = false;
      buildTable();
    } catch (error) {
      await showApiError(error);
      tableSlot.replaceChildren(
        el(
          'p',
          { className: 'py-10 text-center text-sm text-danger-600' },
          'No se pudo cargar la lista de usuarios.',
        ),
      );
    }
  }

  function usuarioLabel(usuarioId: string): string {
    return usuarioLabelById.get(usuarioId) ?? usuarioId;
  }

  function buildTable(): void {
    const columns: DataTableColumn<PerfilMotorizado>[] = [
      { key: 'usuarioId', header: 'Usuario', render: (row) => usuarioLabel(row.usuarioId) },
      { key: 'placa', header: 'Placa' },
      {
        key: 'estado',
        header: 'Estado',
        render: (row) =>
          Badge({ label: ESTADO_LABEL[row.estado], variant: ESTADO_BADGE_VARIANT[row.estado] }),
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

    table = ResourceTable<PerfilMotorizado, { placa: string; estado: string }>({
      columns,
      getRowKey: (row) => row.id,
      fetchPage: (params) =>
        MotorizadosService.listar({
          page: params.page,
          limit: params.limit,
          placa: params.placa,
          estado: (params.estado as EstadoMotorizado) || undefined,
        }),
      filterFields: [
        {
          type: 'select',
          name: 'estado',
          placeholder: 'Todos los estados',
          options: [
            { value: 'disponible', label: 'Disponible' },
            { value: 'ocupado', label: 'Ocupado' },
            { value: 'inactivo', label: 'Inactivo' },
          ],
        },
        { name: 'placa', placeholder: 'Buscar por placa...' },
      ],
      emptyTitle: 'Sin perfiles registrados',
      emptyDescription: 'Crea el primer perfil con el boton "Nuevo perfil".',
    });

    tableSlot.replaceChildren(table.element);
  }

  function openDetailModal(perfil: PerfilMotorizado): void {
    const modal = Modal({
      title: 'Detalle de perfil de motorizado',
      content: DetailList({
        fields: [
          { label: 'ID', value: perfil.id },
          { label: 'Usuario', value: usuarioLabel(perfil.usuarioId) },
          { label: 'Placa', value: perfil.placa },
          { label: 'Estado', value: ESTADO_LABEL[perfil.estado] },
        ],
      }),
      footer: Button({ label: 'Cerrar', variant: 'secondary', onClick: () => modal.close() }),
      onClose: () => modal.destroy(),
    });
    modal.open();
  }

  function openCreateModal(): void {
    const form = buildMotorizadoForm({ mode: 'create', usuarioOptions });
    const modal = FormModal({
      title: 'Nuevo perfil de motorizado',
      content: form.element,
      submitLabel: 'Crear',
      onSubmit: async () => {
        const values = form.validate();
        if (!values || values.usuarioId === undefined) return false;
        try {
          await MotorizadosService.crear({
            usuarioId: values.usuarioId,
            placa: values.placa,
            estado: values.estado,
          });
          showSuccessToast('Perfil creado correctamente');
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

  function openEditModal(perfil: PerfilMotorizado): void {
    const form = buildMotorizadoForm({
      mode: 'edit',
      initial: perfil,
      usuarioLabel: usuarioLabel(perfil.usuarioId),
    });
    const modal = FormModal({
      title: 'Editar perfil de motorizado',
      content: form.element,
      submitLabel: 'Guardar cambios',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;
        try {
          await MotorizadosService.actualizar(perfil.id, {
            placa: values.placa,
            estado: values.estado,
          });
          showSuccessToast('Perfil actualizado correctamente');
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

  async function handleDelete(perfil: PerfilMotorizado): Promise<void> {
    const confirmed = await confirmDialog({
      title: 'Eliminar perfil',
      text: `¿Confirmas eliminar el perfil de "${usuarioLabel(perfil.usuarioId)}"? Esta accion no se puede deshacer.`,
      icon: 'warning',
      danger: true,
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;

    try {
      await MotorizadosService.eliminar(perfil.id);
      showSuccessToast('Perfil eliminado');
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
