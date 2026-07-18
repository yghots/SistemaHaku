import dayjs from 'dayjs';
import { Ban, Eye, Pencil, Truck as TruckIcon, Plus, Trash2, UserCog } from 'lucide';
import { confirmDialog, infoAlert } from '../../../components/alert/alert';
import { Badge } from '../../../components/badge/badge';
import { Button } from '../../../components/button/button';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import { RowActions, type RowAction } from '../../../components/datatable/row-actions';
import { DetailList } from '../../../components/detail-list/detail-list';
import { Loader } from '../../../components/loader/loader';
import { FormModal } from '../../../components/modal/form-modal';
import { Modal } from '../../../components/modal/modal';
import { PageHeader } from '../../../components/page-header/page-header';
import {
  ResourceTable,
  type ResourceTableHandle,
} from '../../../components/resource-table/resource-table';
import { Section } from '../../../components/section/section';
import { Select, type SelectOption } from '../../../components/select/select';
import { showSuccessToast } from '../../../components/toast/toast';
import {
  ESTADO_PAGO_PEDIDO_BADGE_VARIANT,
  ESTADO_PAGO_PEDIDO_LABEL,
} from '../../../constants/estado-pago-pedido';
import { ESTADO_PEDIDO_BADGE_VARIANT, ESTADO_PEDIDO_LABEL } from '../../../constants/estado-pedido';
import { ClientesService } from '../../../services/clientes.service';
import { HttpError } from '../../../services/http/http-error';
import { MotorizadosService } from '../../../services/motorizados.service';
import { PedidosService } from '../../../services/pedidos.service';
import { SessionService } from '../../../services/session.service';
import { SucursalesService } from '../../../services/sucursales.service';
import { TiendasService } from '../../../services/tiendas.service';
import { UsuariosService } from '../../../services/usuarios.service';
import { ESTADOS_CANCELABLES, type EstadoPedido, type Pedido } from '../../../types/pedido';
import { el } from '../../../utils/dom';
import { formatMonto } from '../../../utils/format-monto';
import { formatOptional, SIN_VALOR_LABEL } from '../../../utils/format-optional';
import { formatMotorizado } from '../../../utils/format-motorizado';
import { nombreCompleto } from '../../../utils/nombre-completo';
import { toSelectOptions } from '../../../utils/select-options';
import { buildPedidoForm } from './pedido-form';
import { PedidoFotos } from './pedido-fotos';
import { PedidoHistorial } from './pedido-historial';
import { PedidoPagos } from './pedido-pagos';

const ESTADO_OPTIONS: SelectOption[] = Object.entries(ESTADO_PEDIDO_LABEL).map(
  ([value, label]) => ({ value, label }),
);

/**
 * Pagina de Pedidos: reutiliza la misma infraestructura CRUD que los demas
 * modulos administrativos. Esta fase es unicamente el CRUD (listado,
 * crear, editar, ver detalle, eliminar) — el flujo operativo (asignar
 * motorizado, confirmar recojo/entrega, incidentes, etc.) no se
 * implementa aqui, ver DEVELOPMENT_PROGRESS.md/FRONTEND_PROGRESS.md Fase 7.
 */
export function PedidosPage(): HTMLElement {
  let clienteLabelById = new Map<string, string>();
  let sucursalLabelById = new Map<string, string>();
  let sucursalOptions: SelectOption[] = [];
  let motorizadoLabelById = new Map<string, string>();
  let motorizadoOptions: SelectOption[] = [];
  let usuarioLabelById = new Map<string, string>();
  let table: ResourceTableHandle | undefined;

  const newButton = Button({
    label: 'Nuevo pedido',
    icon: Plus,
    disabled: true,
    onClick: () => openCreateModal(),
  });

  const tableSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando datos' }),
  );

  const container = el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Pedidos',
      description: 'Gestiona los pedidos registrados por las tiendas.',
      breadcrumb: [{ label: 'Pedidos' }],
      actions: newButton,
    }),
    tableSlot,
  );

  void init();

  async function init(): Promise<void> {
    try {
      const [clientes, tiendas, sucursales, motorizados, usuarios] = await Promise.all([
        ClientesService.listar({ page: 1, limit: 100 }),
        TiendasService.listar({ page: 1, limit: 100 }),
        SucursalesService.listar({ page: 1, limit: 100 }),
        MotorizadosService.listar({ page: 1, limit: 100 }),
        UsuariosService.listar({ page: 1, limit: 100 }),
      ]);

      clienteLabelById = new Map(
        clientes.data.map((cliente) => [cliente.id, cliente.nombreCompleto]),
      );
      const tiendaLabelById = new Map(tiendas.data.map((tienda) => [tienda.id, tienda.nombre]));
      sucursalLabelById = new Map(
        sucursales.data.map((sucursal) => [
          sucursal.id,
          `${sucursal.nombre} — ${tiendaLabelById.get(sucursal.tiendaId) ?? sucursal.tiendaId}`,
        ]),
      );
      sucursalOptions = sucursales.data.map((sucursal) => ({
        value: sucursal.id,
        label: sucursalLabelById.get(sucursal.id) ?? sucursal.nombre,
      }));
      motorizadoLabelById = new Map(
        motorizados.data.map((motorizado) => [motorizado.id, formatMotorizado(motorizado)]),
      );
      motorizadoOptions = toSelectOptions(
        motorizados.data,
        (motorizado) => motorizado.id,
        (motorizado) => motorizadoLabelById.get(motorizado.id) ?? formatMotorizado(motorizado),
      );
      usuarioLabelById = new Map(
        usuarios.data.map((usuario) => [usuario.id, nombreCompleto(usuario)]),
      );

      newButton.disabled = false;
      buildTable();
    } catch (error) {
      await showApiError(error);
      tableSlot.replaceChildren(
        el(
          'p',
          { className: 'py-10 text-center text-sm text-danger-600' },
          'No se pudo cargar la informacion necesaria.',
        ),
      );
    }
  }

  function clienteLabel(clienteId: string): string {
    return clienteLabelById.get(clienteId) ?? clienteId;
  }

  function sucursalLabel(sucursalId: string): string {
    return sucursalLabelById.get(sucursalId) ?? sucursalId;
  }

  function motorizadoLabel(motorizadoId: string): string {
    return motorizadoLabelById.get(motorizadoId) ?? motorizadoId;
  }

  function usuarioLabel(usuarioId: string): string {
    return usuarioLabelById.get(usuarioId) ?? usuarioId;
  }

  function buildTable(): void {
    const columns: DataTableColumn<Pedido>[] = [
      { key: 'codigoPedido', header: 'Codigo' },
      { key: 'clienteId', header: 'Cliente', render: (row) => clienteLabel(row.clienteId) },
      { key: 'sucursalId', header: 'Sucursal', render: (row) => sucursalLabel(row.sucursalId) },
      {
        key: 'estado',
        header: 'Estado',
        render: (row) =>
          Badge({
            label: ESTADO_PEDIDO_LABEL[row.estado],
            variant: ESTADO_PEDIDO_BADGE_VARIANT[row.estado],
          }),
      },
      {
        key: 'creadoEn',
        header: 'Creado',
        render: (row) => dayjs(row.creadoEn).format('DD/MM/YYYY HH:mm'),
      },
      {
        key: 'estadoPago',
        header: 'Pago',
        render: (row) =>
          Badge({
            label: ESTADO_PAGO_PEDIDO_LABEL[row.estadoPago],
            variant: ESTADO_PAGO_PEDIDO_BADGE_VARIANT[row.estadoPago],
          }),
      },
      {
        key: 'totalPedido',
        header: 'Total del pedido',
        render: (row) => formatMonto(row.totalPedido),
      },
      {
        key: 'totalPagado',
        header: 'Total pagado',
        render: (row) => formatMonto(row.totalPagado),
      },
      {
        key: 'saldoPendiente',
        header: 'Pendiente',
        render: (row) => formatMonto(row.saldoPendiente),
      },
      {
        key: 'id',
        header: '',
        className: 'text-right',
        render: (row) => {
          const actions: RowAction[] = [
            { label: 'Ver detalle', icon: Eye, onSelect: () => void openDetailModal(row) },
            { label: 'Editar', icon: Pencil, onSelect: () => openEditModal(row) },
          ];
          if (row.estado === 'pendiente') {
            actions.push({
              label: 'Asignar motorizado',
              icon: TruckIcon,
              onSelect: () => openAsignarModal(row),
            });
          }
          if (row.motorizadoActualId) {
            actions.push({
              label: 'Reasignar motorizado',
              icon: UserCog,
              onSelect: () => openReasignarModal(row),
            });
          }
          if (ESTADOS_CANCELABLES.includes(row.estado)) {
            actions.push({
              label: 'Cancelar pedido',
              icon: Ban,
              danger: true,
              onSelect: () => void handleCancelar(row),
            });
          }
          actions.push({
            label: 'Eliminar',
            icon: Trash2,
            danger: true,
            onSelect: () => void handleDelete(row),
          });
          return RowActions(actions);
        },
      },
    ];

    table = ResourceTable<Pedido, { codigoPedido: string; estado: string; sucursalId: string }>({
      columns,
      getRowKey: (row) => row.id,
      fetchPage: (params) =>
        PedidosService.listar({
          page: params.page,
          limit: params.limit,
          codigoPedido: params.codigoPedido,
          estado: (params.estado as EstadoPedido) || undefined,
          sucursalId: params.sucursalId ? Number(params.sucursalId) : undefined,
        }),
      filterFields: [
        { name: 'codigoPedido', placeholder: 'Buscar por codigo...' },
        {
          type: 'select',
          name: 'estado',
          placeholder: 'Todos los estados',
          options: ESTADO_OPTIONS,
        },
        {
          type: 'select',
          name: 'sucursalId',
          placeholder: 'Todas las sucursales',
          options: sucursalOptions,
        },
      ],
      emptyTitle: 'Sin pedidos registrados',
      emptyDescription: 'Crea el primer pedido con el boton "Nuevo pedido".',
    });

    tableSlot.replaceChildren(table.element);
  }

  async function openDetailModal(pedido: Pedido): Promise<void> {
    const historialSlot = el(
      'div',
      { className: 'flex justify-center py-6' },
      Loader({ label: 'Cargando historial' }),
    );
    const fotosSlot = el(
      'div',
      { className: 'flex justify-center py-6' },
      Loader({ label: 'Cargando fotos' }),
    );
    const pagosSlot = el(
      'div',
      { className: 'flex justify-center py-6' },
      Loader({ label: 'Cargando pagos' }),
    );

    const content = el(
      'div',
      { className: 'flex flex-col gap-6' },
      DetailList({
        fields: [
          { label: 'Codigo', value: pedido.codigoPedido },
          { label: 'Cliente', value: clienteLabel(pedido.clienteId) },
          { label: 'Sucursal', value: sucursalLabel(pedido.sucursalId) },
          {
            label: 'Motorizado asignado',
            value: pedido.motorizadoActualId
              ? motorizadoLabel(pedido.motorizadoActualId)
              : SIN_VALOR_LABEL,
          },
          { label: 'Direccion de entrega', value: pedido.direccionEntrega },
          { label: 'Telefono de contacto', value: formatOptional(pedido.telefonoContacto) },
          {
            label: 'Descripcion del producto',
            value: formatOptional(pedido.descripcionProducto),
          },
          { label: 'Valor del producto', value: formatMonto(pedido.valorProducto) },
          { label: 'Costo de envio', value: formatMonto(pedido.costoEnvio) },
          { label: 'Total del pedido', value: formatMonto(pedido.totalPedido) },
          { label: 'Total pagado', value: formatMonto(pedido.totalPagado) },
          { label: 'Pendiente', value: formatMonto(pedido.saldoPendiente) },
          { label: 'Estado', value: ESTADO_PEDIDO_LABEL[pedido.estado] },
          { label: 'Observaciones', value: formatOptional(pedido.observaciones) },
          { label: 'Creado', value: dayjs(pedido.creadoEn).format('DD/MM/YYYY HH:mm') },
        ],
      }),
      Section({ title: 'Historial', children: [historialSlot] }),
      Section({ title: 'Fotos', children: [fotosSlot] }),
      Section({
        title: 'Pagos',
        description:
          'El cobro al cliente se registra durante la entrega, en el panel del Motorizado.',
        children: [pagosSlot],
      }),
    );

    const modal = Modal({
      title: 'Detalle de pedido',
      size: 'xl',
      content,
      footer: Button({ label: 'Cerrar', variant: 'secondary', onClick: () => modal.close() }),
      onClose: () => modal.destroy(),
    });
    modal.open();

    async function loadPagos(): Promise<void> {
      try {
        const [resumen, pagos] = await Promise.all([
          PedidosService.obtenerResumenPagos(pedido.id),
          PedidosService.obtenerPagos(pedido.id, { page: 1, limit: 50 }),
        ]);
        pagosSlot.replaceChildren(PedidoPagos(resumen, pagos.data, usuarioLabel));
      } catch (error) {
        await showApiError(error);
      }
    }
    void loadPagos();

    try {
      const [historial, fotos] = await Promise.all([
        PedidosService.obtenerHistorial(pedido.id, { page: 1, limit: 50 }),
        PedidosService.obtenerFotos(pedido.id, { page: 1, limit: 50 }),
      ]);
      historialSlot.replaceWith(PedidoHistorial(historial.data, motorizadoLabel));
      fotosSlot.replaceWith(PedidoFotos(fotos.data));
    } catch (error) {
      await showApiError(error);
    }
  }

  function openAsignarModal(pedido: Pedido): void {
    const motorizadoField = Select({
      name: 'motorizadoId',
      label: 'Motorizado',
      required: true,
      options: motorizadoOptions,
      placeholder: 'Selecciona un motorizado',
    });
    const modal = FormModal({
      title: 'Asignar motorizado',
      content: el('div', { className: 'flex flex-col gap-4' }, motorizadoField.wrapper),
      submitLabel: 'Asignar',
      onSubmit: async () => {
        const motorizadoIdValue = motorizadoField.select.value;
        if (!motorizadoIdValue) {
          motorizadoField.setError('Selecciona un motorizado');
          return false;
        }
        const usuarioId = Number(SessionService.getCurrentUser()?.id);
        try {
          await PedidosService.asignarMotorizado(pedido.id, {
            motorizadoId: Number(motorizadoIdValue),
            usuarioId,
          });
          showSuccessToast('Motorizado asignado correctamente');
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

  function openReasignarModal(pedido: Pedido): void {
    if (!pedido.motorizadoActualId) return;
    const motorizadoActualId = pedido.motorizadoActualId;
    const options = motorizadoOptions.filter((option) => option.value !== motorizadoActualId);
    const motorizadoField = Select({
      name: 'motorizadoNuevoId',
      label: 'Nuevo motorizado',
      required: true,
      options,
      placeholder: 'Selecciona un motorizado',
    });
    const modal = FormModal({
      title: 'Reasignar motorizado',
      content: el('div', { className: 'flex flex-col gap-4' }, motorizadoField.wrapper),
      submitLabel: 'Reasignar',
      onSubmit: async () => {
        const motorizadoNuevoIdValue = motorizadoField.select.value;
        if (!motorizadoNuevoIdValue) {
          motorizadoField.setError('Selecciona un motorizado');
          return false;
        }
        const usuarioId = Number(SessionService.getCurrentUser()?.id);
        try {
          await PedidosService.reasignarMotorizado(pedido.id, {
            motorizadoAnteriorId: Number(motorizadoActualId),
            motorizadoNuevoId: Number(motorizadoNuevoIdValue),
            usuarioId,
          });
          showSuccessToast('Motorizado reasignado correctamente');
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

  async function handleCancelar(pedido: Pedido): Promise<void> {
    const confirmed = await confirmDialog({
      title: 'Cancelar pedido',
      text: `¿Confirmas cancelar el pedido "${pedido.codigoPedido}"? Esta accion no se puede deshacer.`,
      icon: 'warning',
      danger: true,
      confirmText: 'Cancelar pedido',
    });
    if (!confirmed) return;

    const usuarioId = Number(SessionService.getCurrentUser()?.id);
    try {
      await PedidosService.cancelarPedido(pedido.id, { usuarioId });
      showSuccessToast('Pedido cancelado');
      table?.reload();
    } catch (error) {
      await showApiError(error);
    }
  }

  function openCreateModal(): void {
    const form = buildPedidoForm({ mode: 'create' });
    const modal = FormModal({
      title: 'Nuevo pedido',
      content: form.element,
      submitLabel: 'Crear',
      size: 'lg',
      onSubmit: async () => {
        const values = form.validate();
        if (!values || values.clienteId === undefined || values.sucursalId === undefined)
          return false;
        const creadoPorId = Number(SessionService.getCurrentUser()?.id);
        try {
          await PedidosService.crear({
            sucursalId: values.sucursalId,
            clienteId: values.clienteId,
            creadoPorId,
            direccionEntrega: values.direccionEntrega,
            telefonoContacto: values.telefonoContacto,
            descripcionProducto: values.descripcionProducto,
            valorProducto: values.valorProducto,
            costoEnvio: values.costoEnvio,
            observaciones: values.observaciones,
          });
          showSuccessToast('Pedido creado correctamente');
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

  function openEditModal(pedido: Pedido): void {
    const form = buildPedidoForm({ mode: 'edit', initial: pedido });
    const modal = FormModal({
      title: 'Editar pedido',
      content: form.element,
      submitLabel: 'Guardar cambios',
      size: 'lg',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;
        try {
          await PedidosService.actualizar(pedido.id, {
            direccionEntrega: values.direccionEntrega,
            telefonoContacto: values.telefonoContacto,
            descripcionProducto: values.descripcionProducto,
            valorProducto: values.valorProducto,
            costoEnvio: values.costoEnvio,
            observaciones: values.observaciones,
          });
          showSuccessToast('Pedido actualizado correctamente');
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

  async function handleDelete(pedido: Pedido): Promise<void> {
    const confirmed = await confirmDialog({
      title: 'Eliminar pedido',
      text: `¿Confirmas eliminar el pedido "${pedido.codigoPedido}"? Esta accion no se puede deshacer.`,
      icon: 'warning',
      danger: true,
      confirmText: 'Eliminar',
    });
    if (!confirmed) return;

    try {
      await PedidosService.eliminar(pedido.id);
      showSuccessToast('Pedido eliminado');
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
