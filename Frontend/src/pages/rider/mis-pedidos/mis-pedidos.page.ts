import dayjs from 'dayjs';
import { AlertTriangle, CheckCircle2, Eye, Navigation, PackageCheck, UserX, XCircle } from 'lucide';
import { confirmDialog, infoAlert } from '../../../components/alert/alert';
import { Badge } from '../../../components/badge/badge';
import { Button } from '../../../components/button/button';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import { RowActions, type RowAction } from '../../../components/datatable/row-actions';
import { DetailList } from '../../../components/detail-list/detail-list';
import { EmptyState } from '../../../components/empty-state/empty-state';
import { Input } from '../../../components/input/input';
import { Loader } from '../../../components/loader/loader';
import { FormModal } from '../../../components/modal/form-modal';
import { Modal } from '../../../components/modal/modal';
import { PageHeader } from '../../../components/page-header/page-header';
import {
  ResourceTable,
  type ResourceTableHandle,
} from '../../../components/resource-table/resource-table';
import type { SelectOption } from '../../../components/select/select';
import { Section } from '../../../components/section/section';
import { showSuccessToast } from '../../../components/toast/toast';
import {
  ESTADO_PEDIDO_BADGE_VARIANT,
  ESTADO_PEDIDO_LABEL,
  ESTADOS_TERMINALES,
} from '../../../constants/estado-pedido';
import { ClientesService } from '../../../services/clientes.service';
import { HttpError } from '../../../services/http/http-error';
import { IncidentesService } from '../../../services/incidentes.service';
import { MotorizadosService } from '../../../services/motorizados.service';
import { PedidosService } from '../../../services/pedidos.service';
import { SessionService } from '../../../services/session.service';
import { SucursalesService } from '../../../services/sucursales.service';
import { TiendasService } from '../../../services/tiendas.service';
import type { PaginatedResponse } from '../../../types/api';
import type { Pedido } from '../../../types/pedido';
import { el } from '../../../utils/dom';
import { fetchAllPages } from '../../../utils/fetch-all-pages';
import { formatMonto } from '../../../utils/format-monto';
import { formatOptional } from '../../../utils/format-optional';
import { formatMotorizado } from '../../../utils/format-motorizado';
import { PedidoFotos } from '../../admin/pedidos/pedido-fotos';
import { PedidoHistorial } from '../../admin/pedidos/pedido-historial';
import { buildConfirmarEntregaForm } from './confirmar-entrega-form';
import { buildIncidenteForm } from './incidente-form';

const ESTADO_OPTIONS: SelectOption[] = Object.entries(ESTADO_PEDIDO_LABEL).map(
  ([value, label]) => ({ value, label }),
);

/**
 * "Mis pedidos": panel del Motorizado, flujo operativo completo (CU08-CU12).
 * `GET /pedidos` no admite filtrar por `motorizadoActualId` (revisado en
 * list-pedidos-query.dto.ts), asi que se recorren todas las paginas
 * existentes (`fetchAllPages`, reutiliza el mismo endpoint paginado) y se
 * filtra en el cliente por el `motorizadoId` propio — nunca se muestran
 * pedidos de otros motorizados. El resultado filtrado se pagina de nuevo
 * en memoria y se sirve a `ResourceTable` con un `fetchPage` local, para
 * reutilizar exactamente la misma infraestructura de tabla/filtros/paginacion.
 */
export function MisPedidosPage(): HTMLElement {
  let miMotorizadoId: string | null = null;
  let clienteLabelById = new Map<string, string>();
  let sucursalLabelById = new Map<string, string>();
  let motorizadoLabelById = new Map<string, string>();
  let pedidosActivos: Pedido[] = [];
  let table: ResourceTableHandle | undefined;

  const reportarIncidenteButton = Button({
    label: 'Reportar incidente',
    icon: AlertTriangle,
    variant: 'outline',
    disabled: true,
    onClick: () => openIncidenteModal(),
  });

  const contentSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando pedidos' }),
  );

  const container = el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Mis pedidos',
      description: 'Pedidos actualmente asignados a ti.',
      breadcrumb: [{ label: 'Mis pedidos' }],
      actions: reportarIncidenteButton,
    }),
    contentSlot,
  );

  void init();

  async function init(): Promise<void> {
    const currentUser = SessionService.getCurrentUser();
    if (!currentUser) return;

    try {
      const perfil = await MotorizadosService.buscarPorUsuarioId(currentUser.id);
      if (!perfil) {
        contentSlot.replaceChildren(
          EmptyState({
            icon: AlertTriangle,
            title: 'No tienes un perfil operativo',
            description: 'Contacta a un administrador para que te asigne un perfil de motorizado.',
          }),
        );
        return;
      }
      miMotorizadoId = perfil.id;

      const [clientes, sucursales, tiendas, motorizados, todosPedidos] = await Promise.all([
        ClientesService.listar({ page: 1, limit: 100 }),
        SucursalesService.listar({ page: 1, limit: 100 }),
        TiendasService.listar({ page: 1, limit: 100 }),
        MotorizadosService.listar({ page: 1, limit: 100 }),
        fetchAllPages((params) => PedidosService.listar(params)),
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
      motorizadoLabelById = new Map(
        motorizados.data.map((motorizado) => [motorizado.id, formatMotorizado(motorizado)]),
      );

      pedidosActivos = todosPedidos.filter(
        (pedido) =>
          pedido.motorizadoActualId === miMotorizadoId &&
          !ESTADOS_TERMINALES.includes(pedido.estado),
      );

      reportarIncidenteButton.disabled = false;
      buildTable();
    } catch (error) {
      await showApiError(error);
      contentSlot.replaceChildren(
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

  /** Simula la paginacion de un backend sobre el arreglo ya filtrado en memoria, para reutilizar ResourceTable tal cual. */
  function fetchPageLocal(
    params: { page: number; limit: number } & Partial<{ codigoPedido: string; estado: string }>,
  ): Promise<PaginatedResponse<Pedido>> {
    let filtrados = pedidosActivos;
    if (params.codigoPedido) {
      const termino = params.codigoPedido.toLowerCase();
      filtrados = filtrados.filter((pedido) => pedido.codigoPedido.toLowerCase().includes(termino));
    }
    if (params.estado) {
      filtrados = filtrados.filter((pedido) => pedido.estado === params.estado);
    }
    const start = (params.page - 1) * params.limit;
    const data = filtrados.slice(start, start + params.limit);
    return Promise.resolve({
      data,
      total: filtrados.length,
      page: params.page,
      limit: params.limit,
    });
  }

  /** Aplica la respuesta de una accion del flujo al arreglo local sin volver a consultar todo el listado. */
  function applyPedidoActualizado(actualizado: Pedido): void {
    const index = pedidosActivos.findIndex((pedido) => pedido.id === actualizado.id);
    if (ESTADOS_TERMINALES.includes(actualizado.estado)) {
      if (index !== -1) pedidosActivos.splice(index, 1);
    } else if (index !== -1) {
      pedidosActivos[index] = actualizado;
    }
    table?.reload();
  }

  function buildTable(): void {
    const columns: DataTableColumn<Pedido>[] = [
      { key: 'codigoPedido', header: 'Codigo' },
      { key: 'clienteId', header: 'Cliente', render: (row) => clienteLabel(row.clienteId) },
      { key: 'sucursalId', header: 'Sucursal', render: (row) => sucursalLabel(row.sucursalId) },
      { key: 'direccionEntrega', header: 'Direccion de entrega' },
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
        key: 'id',
        header: '',
        className: 'text-right',
        render: (row) => {
          const actions: RowAction[] = [
            { label: 'Ver detalle', icon: Eye, onSelect: () => void openDetailModal(row) },
          ];
          if (row.estado === 'asignado') {
            actions.push({
              label: 'Confirmar recojo',
              icon: PackageCheck,
              onSelect: () => openConfirmarRecojoModal(row),
            });
          }
          if (row.estado === 'recogido') {
            actions.push({
              label: 'Iniciar ruta',
              icon: Navigation,
              onSelect: () => void handleIniciarRuta(row),
            });
          }
          if (row.estado === 'en_ruta') {
            actions.push(
              {
                label: 'Confirmar entrega',
                icon: CheckCircle2,
                onSelect: () => void openConfirmarEntregaModal(row),
              },
              {
                label: 'Cliente ausente',
                icon: UserX,
                onSelect: () => void handleClienteAusente(row),
              },
              {
                label: 'Rechazo',
                icon: XCircle,
                danger: true,
                onSelect: () => void handleRechazo(row),
              },
            );
          }
          actions.push({
            label: 'Reportar incidente',
            icon: AlertTriangle,
            onSelect: () => openIncidenteModal(row),
          });
          return RowActions(actions);
        },
      },
    ];

    table = ResourceTable<Pedido, { codigoPedido: string; estado: string }>({
      columns,
      getRowKey: (row) => row.id,
      fetchPage: fetchPageLocal,
      filterFields: [
        { name: 'codigoPedido', placeholder: 'Buscar por codigo...' },
        {
          type: 'select',
          name: 'estado',
          placeholder: 'Todos los estados',
          options: ESTADO_OPTIONS,
        },
      ],
      emptyTitle: 'No tienes pedidos activos',
      emptyDescription: 'Los pedidos que te asignen apareceran aqui.',
    });

    contentSlot.replaceChildren(table.element);
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

    const content = el(
      'div',
      { className: 'flex flex-col gap-6' },
      DetailList({
        fields: [
          { label: 'Codigo', value: pedido.codigoPedido },
          { label: 'Cliente', value: clienteLabel(pedido.clienteId) },
          { label: 'Sucursal', value: sucursalLabel(pedido.sucursalId) },
          { label: 'Direccion de entrega', value: pedido.direccionEntrega },
          { label: 'Telefono de contacto', value: formatOptional(pedido.telefonoContacto) },
          {
            label: 'Descripcion del producto',
            value: formatOptional(pedido.descripcionProducto),
          },
          { label: 'Valor del producto', value: formatMonto(pedido.valorProducto) },
          { label: 'Costo de envio', value: formatMonto(pedido.costoEnvio) },
          { label: 'Estado', value: ESTADO_PEDIDO_LABEL[pedido.estado] },
          { label: 'Observaciones', value: formatOptional(pedido.observaciones) },
          { label: 'Creado', value: dayjs(pedido.creadoEn).format('DD/MM/YYYY HH:mm') },
        ],
      }),
      Section({ title: 'Historial', children: [historialSlot] }),
      Section({ title: 'Fotos', children: [fotosSlot] }),
    );

    const modal = Modal({
      title: 'Detalle de pedido',
      size: 'xl',
      content,
      footer: Button({ label: 'Cerrar', variant: 'secondary', onClick: () => modal.close() }),
      onClose: () => modal.destroy(),
    });
    modal.open();

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

  function openConfirmarRecojoModal(pedido: Pedido): void {
    if (!miMotorizadoId) return;
    const urlField = Input({
      name: 'urlImagen',
      label: 'URL de la foto del recojo',
      required: true,
      placeholder: 'https://...',
    });
    const modal = FormModal({
      title: 'Confirmar recojo',
      content: el('div', { className: 'flex flex-col gap-4' }, urlField.wrapper),
      submitLabel: 'Confirmar',
      onSubmit: async () => {
        const urlImagen = urlField.input.value.trim();
        if (!urlImagen) {
          urlField.setError('Este campo es obligatorio');
          return false;
        }
        try {
          const actualizado = await PedidosService.confirmarRecojo(pedido.id, {
            motorizadoId: Number(miMotorizadoId),
            urlImagen,
          });
          showSuccessToast('Recojo confirmado');
          applyPedidoActualizado(actualizado);
          return true;
        } catch (error) {
          await showApiError(error);
          return false;
        }
      },
    });
    modal.open();
  }

  async function handleIniciarRuta(pedido: Pedido): Promise<void> {
    if (!miMotorizadoId) return;
    const confirmed = await confirmDialog({
      title: 'Iniciar ruta',
      text: `¿Confirmas iniciar la ruta del pedido "${pedido.codigoPedido}"?`,
      icon: 'question',
    });
    if (!confirmed) return;

    try {
      const actualizado = await PedidosService.iniciarRuta(pedido.id, {
        motorizadoId: Number(miMotorizadoId),
      });
      showSuccessToast('Ruta iniciada');
      applyPedidoActualizado(actualizado);
    } catch (error) {
      await showApiError(error);
    }
  }

  /**
   * Confirmar entrega (CU10, corregido en la Fase 20.1): el cobro al
   * cliente ocurre aqui, no en la creacion del pedido (Admin). El modal se
   * abre de inmediato (mismo patron que "Ver detalle") y el resumen
   * economico se carga en segundo plano. Al confirmar: primero se
   * registran los pagos armados en memoria, uno por uno — si alguno falla,
   * la entrega NUNCA se confirma y los pagos ya registrados no se
   * reintentan (se quitan de la lista pendiente apenas tienen exito). Solo
   * si todos los pagos se registraron (o no habia ninguno) se llama a
   * `confirmarEntrega`.
   */
  async function openConfirmarEntregaModal(pedido: Pedido): Promise<void> {
    if (!miMotorizadoId) return;
    const form = buildConfirmarEntregaForm(pedido);
    const modal = FormModal({
      title: 'Confirmar entrega',
      content: form.element,
      submitLabel: 'Confirmar entrega',
      size: 'lg',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;

        const usuario = SessionService.getCurrentUser();
        if (!usuario) {
          await infoAlert({
            title: 'No se pudo confirmar la entrega',
            text: 'No hay una sesion activa.',
            icon: 'error',
          });
          return false;
        }

        for (const pago of form.getPagosPendientes()) {
          try {
            await PedidosService.registrarPago(pedido.id, {
              metodoPago: pago.metodoPago,
              monto: pago.monto,
              montoRecibido: pago.montoRecibido,
              observacion: pago.observacion,
              creadoPorId: Number(usuario.id),
            });
            form.marcarPagoRegistrado(pago.tempId);
          } catch (error) {
            await showApiError(error);
            return false;
          }
        }

        try {
          const actualizado = await PedidosService.confirmarEntrega(pedido.id, {
            motorizadoId: Number(miMotorizadoId),
            fotos: values.fotos,
            observaciones: values.observaciones,
          });
          showSuccessToast('Entrega confirmada');
          applyPedidoActualizado(actualizado);
          return true;
        } catch (error) {
          await showApiError(error);
          return false;
        }
      },
    });
    modal.open();

    try {
      const resumen = await PedidosService.obtenerResumenPagos(pedido.id);
      form.setResumen(resumen);
    } catch (error) {
      await showApiError(error);
    }
  }

  async function handleClienteAusente(pedido: Pedido): Promise<void> {
    if (!miMotorizadoId) return;
    const confirmed = await confirmDialog({
      title: 'Registrar cliente ausente',
      text: `¿Confirmas registrar cliente ausente para el pedido "${pedido.codigoPedido}"? Esta accion no se puede deshacer.`,
      icon: 'warning',
      danger: true,
      confirmText: 'Registrar',
    });
    if (!confirmed) return;

    try {
      const actualizado = await PedidosService.registrarClienteAusente(pedido.id, {
        motorizadoId: Number(miMotorizadoId),
      });
      showSuccessToast('Cliente ausente registrado');
      applyPedidoActualizado(actualizado);
    } catch (error) {
      await showApiError(error);
    }
  }

  async function handleRechazo(pedido: Pedido): Promise<void> {
    if (!miMotorizadoId) return;
    const confirmed = await confirmDialog({
      title: 'Registrar rechazo',
      text: `¿Confirmas registrar el rechazo del pedido "${pedido.codigoPedido}"? Esta accion no se puede deshacer.`,
      icon: 'warning',
      danger: true,
      confirmText: 'Registrar',
    });
    if (!confirmed) return;

    try {
      const actualizado = await PedidosService.registrarRechazo(pedido.id, {
        motorizadoId: Number(miMotorizadoId),
      });
      showSuccessToast('Rechazo registrado');
      applyPedidoActualizado(actualizado);
    } catch (error) {
      await showApiError(error);
    }
  }

  function openIncidenteModal(pedido?: Pedido): void {
    if (!miMotorizadoId) return;
    const form = buildIncidenteForm({ codigoPedido: pedido?.codigoPedido });
    const modal = FormModal({
      title: 'Reportar incidente',
      content: form.element,
      submitLabel: 'Reportar',
      onSubmit: async () => {
        const values = form.validate();
        if (!values) return false;
        try {
          await IncidentesService.crear({
            pedidoId: pedido ? Number(pedido.id) : undefined,
            motorizadoId: Number(miMotorizadoId),
            tipo: values.tipo,
          });
          showSuccessToast('Incidente reportado');
          return true;
        } catch (error) {
          await showApiError(error);
          return false;
        }
      },
    });
    modal.open();
  }

  async function showApiError(error: unknown): Promise<void> {
    const message =
      error instanceof HttpError ? error.message : 'No se pudo conectar con el servidor.';
    await infoAlert({ title: 'No se pudo completar la accion', text: message, icon: 'error' });
  }

  return container;
}
