import dayjs from 'dayjs';
import { AlertTriangle, Eye } from 'lucide';
import { infoAlert } from '../../../components/alert/alert';
import { Badge } from '../../../components/badge/badge';
import { Button } from '../../../components/button/button';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import { RowActions } from '../../../components/datatable/row-actions';
import { DetailList } from '../../../components/detail-list/detail-list';
import { EmptyState } from '../../../components/empty-state/empty-state';
import { Loader } from '../../../components/loader/loader';
import { Modal } from '../../../components/modal/modal';
import { PageHeader } from '../../../components/page-header/page-header';
import {
  ResourceTable,
  type ResourceTableHandle,
} from '../../../components/resource-table/resource-table';
import type { SelectOption } from '../../../components/select/select';
import { Section } from '../../../components/section/section';
import {
  ESTADO_PEDIDO_BADGE_VARIANT,
  ESTADO_PEDIDO_LABEL,
  ESTADOS_TERMINALES,
} from '../../../constants/estado-pedido';
import { ClientesService } from '../../../services/clientes.service';
import { HttpError } from '../../../services/http/http-error';
import { MotorizadosService } from '../../../services/motorizados.service';
import { PedidosService } from '../../../services/pedidos.service';
import { SessionService } from '../../../services/session.service';
import { SucursalesService } from '../../../services/sucursales.service';
import { TiendasService } from '../../../services/tiendas.service';
import type { PaginatedResponse } from '../../../types/api';
import type { Pedido } from '../../../types/pedido';
import { el } from '../../../utils/dom';
import { fetchAllPages } from '../../../utils/fetch-all-pages';
import { PedidoFotos } from '../../admin/pedidos/pedido-fotos';
import { PedidoHistorial } from '../../admin/pedidos/pedido-historial';

const ESTADO_OPTIONS: SelectOption[] = ESTADOS_TERMINALES.map((value) => ({
  value,
  label: ESTADO_PEDIDO_LABEL[value],
}));

function formatMonto(value: string | null): string {
  return value ? `$${value}` : '—';
}

/**
 * Historial del Motorizado: pedidos ya cerrados (estados terminales) que
 * estuvieron asignados a el. Solo lectura — ninguna accion del flujo
 * operativo aplica a un pedido ya cerrado. Mismo mecanismo que
 * "Mis pedidos" (`fetchAllPages` + filtro por `motorizadoActualId`
 * propio, ya que el backend no admite ese filtro), pero restringido a
 * estados terminales en vez de activos.
 */
export function HistorialPage(): HTMLElement {
  let clienteLabelById = new Map<string, string>();
  let sucursalLabelById = new Map<string, string>();
  let pedidosCerrados: Pedido[] = [];

  const contentSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando historial' }),
  );

  const container = el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Historial',
      description: 'Pedidos que ya completaste, cancelaste o cerraste.',
      breadcrumb: [{ label: 'Historial' }],
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

      const [clientes, sucursales, tiendas, todosPedidos] = await Promise.all([
        ClientesService.listar({ page: 1, limit: 100 }),
        SucursalesService.listar({ page: 1, limit: 100 }),
        TiendasService.listar({ page: 1, limit: 100 }),
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

      pedidosCerrados = todosPedidos.filter(
        (pedido) =>
          pedido.motorizadoActualId === perfil.id && ESTADOS_TERMINALES.includes(pedido.estado),
      );

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

  function fetchPageLocal(
    params: { page: number; limit: number } & Partial<{ codigoPedido: string; estado: string }>,
  ): Promise<PaginatedResponse<Pedido>> {
    let filtrados = pedidosCerrados;
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
        key: 'id',
        header: '',
        className: 'text-right',
        render: (row) =>
          RowActions([
            { label: 'Ver detalle', icon: Eye, onSelect: () => void openDetailModal(row) },
          ]),
      },
    ];

    const table: ResourceTableHandle = ResourceTable<
      Pedido,
      { codigoPedido: string; estado: string }
    >({
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
      emptyTitle: 'Sin pedidos en tu historial',
      emptyDescription: 'Los pedidos que completes, canceles o cierres apareceran aqui.',
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
          { label: 'Telefono de contacto', value: pedido.telefonoContacto ?? '—' },
          { label: 'Descripcion del producto', value: pedido.descripcionProducto ?? '—' },
          { label: 'Valor del producto', value: formatMonto(pedido.valorProducto) },
          { label: 'Costo de envio', value: formatMonto(pedido.costoEnvio) },
          { label: 'Estado', value: ESTADO_PEDIDO_LABEL[pedido.estado] },
          { label: 'Observaciones', value: pedido.observaciones ?? '—' },
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
      historialSlot.replaceWith(PedidoHistorial(historial.data));
      fotosSlot.replaceWith(PedidoFotos(fotos.data));
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
