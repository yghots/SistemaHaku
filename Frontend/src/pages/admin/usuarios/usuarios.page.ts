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
import { MotorizadosService } from '../../../services/motorizados.service';
import { HttpError } from '../../../services/http/http-error';
import type { Usuario } from '../../../types/usuario';
import type { PerfilMotorizado } from '../../../types/perfil-motorizado';
import { el } from '../../../utils/dom';
import { nombreCompleto } from '../../../utils/nombre-completo';
import { SIN_VALOR_LABEL } from '../../../utils/format-optional';
import { buildUsuarioForm } from './usuario-form';

// Fase 25: opciones del filtro por rol, misma convencion que ESTADO_OPTIONS
// en pedidos.page.ts (Object.entries sobre el mapa de etiquetas ya existente).
const ROL_OPTIONS = Object.entries(ROL_USUARIO_LABEL).map(([value, label]) => ({
  value,
  label,
}));

// Fase 33 (Parte 3 del rediseno de ciclo de vida): tri-estado
// Activos/Inactivos/Todos. `placeholder` ("Todos") se usa como la opcion
// vacia que ResourceTable inserta automaticamente para "sin filtro" — no es
// un tercer valor manual, es el mecanismo ya existente del componente.
const ACTIVO_OPTIONS = [
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

type UsuariosFilters = {
  usuario: string;
  correo: string;
  rol: string;
  activo: string;
};

/**
 * Pagina de referencia para todos los modulos administrativos (CRUD completo sobre /usuarios).
 *
 * Fase 33 (rediseno de ciclo de vida de Usuarios y Motorizados): absorbe la
 * gestion del perfil operativo de Motorizados (columna "Placa" + campo
 * condicional en el formulario) — la pantalla independiente `/admin/motorizados`
 * se retiro porque, sin el atributo `estado` (eliminado por no participar en
 * ninguna regla de negocio), la unica informacion propia de ese modulo era la
 * placa, insuficiente para justificar un CRUD separado.
 */
export function UsuariosPage(): HTMLElement {
  // usuarioId -> placa, para la columna "Placa" (solo relevante en filas con
  // rol motorizado). Se carga una vez al montar la pagina, mismo patron ya
  // usado por Incidentes/Pedidos/Reportes para resolver un motorizado a una
  // etiqueta sin una consulta N+1 por fila.
  let placaPorUsuarioId = new Map<string, string>();

  // Columnas fijas, independientes del filtro de Rol.
  const columnaNombres: DataTableColumn<Usuario> = {
    key: 'nombres',
    header: 'Nombre completo',
    render: (row) => nombreCompleto(row),
  };
  const columnaUsuario: DataTableColumn<Usuario> = { key: 'usuario', header: 'Usuario' };
  const columnaCorreo: DataTableColumn<Usuario> = { key: 'correo', header: 'Correo' };
  const columnaRol: DataTableColumn<Usuario> = {
    key: 'rol',
    header: 'Rol',
    render: (row) =>
      Badge({
        label: ROL_USUARIO_LABEL[row.rol],
        variant: ROL_USUARIO_BADGE_VARIANT[row.rol],
      }),
  };
  // Solo tiene sentido cuando el listado puede incluir motorizados (filtro
  // de Rol en "Motorizado" o "Todos") — con "Administrador" seleccionado,
  // ningun usuario del listado tendria placa, asi que la columna se retira
  // por completo en vez de mostrarse siempre vacia.
  const columnaPlaca: DataTableColumn<Usuario> = {
    key: 'id',
    header: 'Placa',
    render: (row) => (row.rol === 'motorizado' ? placaLabel(row.id) : ''),
  };
  const columnaActivo: DataTableColumn<Usuario> = {
    key: 'activo',
    header: 'Estado',
    render: (row) =>
      Badge({
        label: row.activo ? 'Activo' : 'Inactivo',
        variant: row.activo ? 'success' : 'neutral',
      }),
  };
  const columnaAcciones: DataTableColumn<Usuario> = {
    key: 'id',
    header: '',
    className: 'text-right',
    render: (row) =>
      RowActions([
        { label: 'Ver detalle', icon: Eye, onSelect: () => openDetailModal(row) },
        { label: 'Editar', icon: Pencil, onSelect: () => void openEditModal(row) },
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
  };

  function mostrarColumnaPlaca(rolFiltro: string | undefined): boolean {
    return rolFiltro !== 'administrador';
  }

  function construirColumnas(mostrarPlaca: boolean): DataTableColumn<Usuario>[] {
    return [
      columnaNombres,
      columnaUsuario,
      columnaCorreo,
      columnaRol,
      ...(mostrarPlaca ? [columnaPlaca] : []),
      columnaActivo,
      columnaAcciones,
    ];
  }

  // `ResourceTable` guarda esta misma referencia de arreglo y la vuelve a
  // leer en cada recarga (`load()` -> `renderTable()`) — mutar su
  // contenido in-place (nunca reasignar `columns`) es lo que permite que
  // agregar/quitar la columna "Placa" se refleje sin tocar `ResourceTable`
  // ni `DataTable`. Arranca mostrando la columna porque el filtro de Rol
  // no tiene `initialValue` (por defecto es "Todos los roles").
  const columns: DataTableColumn<Usuario>[] = construirColumnas(true);

  function sincronizarColumnaPlaca(rolFiltro: string | undefined): void {
    const debeMostrarse = mostrarColumnaPlaca(rolFiltro);
    const estaMostrada = columns.includes(columnaPlaca);
    if (debeMostrarse === estaMostrada) return;
    columns.splice(0, columns.length, ...construirColumnas(debeMostrarse));
  }

  const table = ResourceTable<Usuario, UsuariosFilters>({
    columns,
    getRowKey: (row) => row.id,
    fetchPage: (params) => {
      sincronizarColumnaPlaca(params.rol);
      return UsuariosService.listar({
        page: params.page,
        limit: params.limit,
        usuario: params.usuario,
        correo: params.correo,
        rol: (params.rol as Usuario['rol']) || undefined,
        activo: params.activo === undefined ? undefined : params.activo === 'true',
      });
    },
    filterFields: [
      { name: 'usuario', placeholder: 'Buscar por usuario...' },
      { name: 'correo', placeholder: 'Buscar por correo...' },
      { type: 'select', name: 'rol', placeholder: 'Todos los roles', options: ROL_OPTIONS },
      {
        type: 'select',
        name: 'activo',
        placeholder: 'Todos',
        options: ACTIVO_OPTIONS,
        initialValue: 'true',
      },
    ],
    emptyTitle: 'Sin usuarios registrados',
    emptyDescription: 'Crea el primer usuario con el boton "Nuevo usuario".',
  });

  void cargarPlacas();

  async function cargarPlacas(): Promise<void> {
    try {
      const response = await MotorizadosService.listar({ page: 1, limit: 100 });
      placaPorUsuarioId = new Map(response.data.map((perfil) => [perfil.usuarioId, perfil.placa]));
      table.reload();
    } catch {
      // Si falla la carga de placas, la columna simplemente queda vacia —
      // no bloquea el resto de la pantalla de Usuarios.
    }
  }

  function placaLabel(usuarioId: string): string {
    return placaPorUsuarioId.get(usuarioId) ?? SIN_VALOR_LABEL;
  }

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
          ...(usuario.rol === 'motorizado'
            ? [{ label: 'Placa', value: placaLabel(usuario.id) }]
            : []),
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
          const nuevoUsuario = await UsuariosService.crear({
            nombres: values.nombres,
            apellidos: values.apellidos,
            usuario: values.usuario,
            correo: values.correo,
            password: values.password,
            rol: values.rol,
          });

          if (values.rol === 'motorizado' && values.placa) {
            try {
              await MotorizadosService.crear({
                usuarioId: Number(nuevoUsuario.id),
                placa: values.placa,
              });
            } catch (error) {
              // El usuario ya se creo (accion irreversible) — se informa el
              // fallo puntual del perfil sin revertir nada; el administrador
              // puede completarlo despues desde "Editar".
              showSuccessToast('Usuario creado correctamente');
              await showApiError(error, 'No se pudo registrar la placa del motorizado');
              table.reload();
              void cargarPlacas();
              return true;
            }
          }

          showSuccessToast('Usuario creado correctamente');
          table.reload();
          void cargarPlacas();
          return true;
        } catch (error) {
          await showApiError(error);
          return false;
        }
      },
    });
    modal.open();
  }

  async function openEditModal(usuario: Usuario): Promise<void> {
    let perfilExistente: PerfilMotorizado | null = null;
    if (usuario.rol === 'motorizado') {
      try {
        perfilExistente = await MotorizadosService.buscarPorUsuarioId(usuario.id);
      } catch {
        // Sin perfil precargado, el campo de placa simplemente se muestra vacio.
      }
    }

    const form = buildUsuarioForm({
      mode: 'edit',
      initial: usuario,
      initialPlaca: perfilExistente?.placa,
    });
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

          if (values.rol === 'motorizado' && values.placa) {
            try {
              if (perfilExistente) {
                if (values.placa !== perfilExistente.placa) {
                  await MotorizadosService.actualizar(perfilExistente.id, {
                    placa: values.placa,
                  });
                }
              } else {
                await MotorizadosService.crear({
                  usuarioId: Number(usuario.id),
                  placa: values.placa,
                });
              }
            } catch (error) {
              showSuccessToast('Usuario actualizado correctamente');
              await showApiError(error, 'No se pudo guardar la placa del motorizado');
              table.reload();
              void cargarPlacas();
              return true;
            }
          }

          showSuccessToast('Usuario actualizado correctamente');
          table.reload();
          void cargarPlacas();
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
      text: `¿Confirmas eliminar a "${nombreCompleto(usuario)}"? Esta accion no se puede deshacer. Si el usuario tiene historial de negocio asociado, no podra eliminarse — usa "Desactivar" en su lugar.`,
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

  async function showApiError(
    error: unknown,
    title = 'No se pudo completar la accion',
  ): Promise<void> {
    const message =
      error instanceof HttpError ? error.message : 'No se pudo conectar con el servidor.';
    await infoAlert({ title, text: message, icon: 'error' });
  }

  return el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Usuarios',
      description: 'Gestiona las cuentas de acceso al sistema y sus perfiles operativos.',
      breadcrumb: [{ label: 'Usuarios' }],
      actions: Button({ label: 'Nuevo usuario', icon: Plus, onClick: openCreateModal }),
    }),
    table.element,
  );
}
