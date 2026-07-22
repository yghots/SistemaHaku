import dayjs from 'dayjs';
import { Check, Eye, X } from 'lucide';
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
  ReportFilters,
  type ReportFilterField,
} from '../../../components/report-filters/report-filters';
import {
  ResourceTable,
  type ResourceTableHandle,
} from '../../../components/resource-table/resource-table';
import { Textarea } from '../../../components/textarea/textarea';
import { showSuccessToast } from '../../../components/toast/toast';
import {
  ESTADO_SOLICITUD_PEDIDO_BADGE_VARIANT,
  ESTADO_SOLICITUD_PEDIDO_LABEL,
} from '../../../constants/estado-solicitud-pedido';
import { HttpError } from '../../../services/http/http-error';
import { PedidosService } from '../../../services/pedidos.service';
import { SessionService } from '../../../services/session.service';
import { SolicitudesService } from '../../../services/solicitudes.service';
import { SucursalesService } from '../../../services/sucursales.service';
import { TiendasService } from '../../../services/tiendas.service';
import type { EstadoSolicitudPedido, SolicitudPedido } from '../../../types/solicitud-pedido';
import { el } from '../../../utils/dom';
import { formatMonto } from '../../../utils/format-monto';
import { formatOptional, SIN_VALOR_LABEL } from '../../../utils/format-optional';

const ESTADO_OPTIONS = Object.entries(ESTADO_SOLICITUD_PEDIDO_LABEL).map(([value, label]) => ({
  value,
  label,
}));

/**
 * Panel administrativo de Solicitudes de Pedido: solo lectura + aprobar/
 * rechazar (backend `Backend/src/modules/solicitudes-pedido`, endpoints
 * administrativos bajo `/solicitudes`). Una solicitud aprobada ya creo su
 * Pedido — el seguimiento posterior continua exclusivamente en el modulo
 * Pedidos existente, esta pagina no duplica ese flujo. Filtros: los mismos
 * que soporta `ListSolicitudesQueryDto` (estado, tienda, fecha) — misma
 * infraestructura `ReportFilters` + `ResourceTable` sin filtros propios ya
 * usada en Reportes (la tabla se reconstruye por completo al aplicar).
 */
export function SolicitudesPage(): HTMLElement {
  let sucursalLabelById = new Map<string, string>();
  let currentParams: Record<string, string> = {};
  let table: ResourceTableHandle | undefined;

  const tableSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando datos' }),
  );

  const container = el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Solicitudes',
      description: 'Revisa, aprueba o rechaza las solicitudes de pedido recibidas.',
      breadcrumb: [{ label: 'Solicitudes' }],
    }),
    el('div', { className: 'flex justify-center py-6' }, Loader({ label: 'Cargando filtros' })),
  );

  void init();

  async function init(): Promise<void> {
    try {
      const [tiendas, sucursales] = await Promise.all([
        TiendasService.listar({ page: 1, limit: 100 }),
        SucursalesService.listar({ page: 1, limit: 100 }),
      ]);

      const tiendaLabelById = new Map(tiendas.data.map((tienda) => [tienda.id, tienda.nombre]));
      sucursalLabelById = new Map(
        sucursales.data.map((sucursal) => [
          sucursal.id,
          `${sucursal.nombre} — ${tiendaLabelById.get(sucursal.tiendaId) ?? sucursal.tiendaId}`,
        ]),
      );

      const fields: ReportFilterField[] = [
        { type: 'dateRange', nameDesde: 'fechaDesde', nameHasta: 'fechaHasta' },
        {
          type: 'select',
          name: 'tiendaId',
          label: 'Tienda',
          placeholder: 'Todas las tiendas',
          options: tiendas.data.map((tienda) => ({ value: tienda.id, label: tienda.nombre })),
        },
        {
          type: 'select',
          name: 'estado',
          label: 'Estado',
          placeholder: 'Todos los estados',
          options: ESTADO_OPTIONS,
        },
      ];

      const filtersHandle = ReportFilters({
        fields,
        onApply: (params) => {
          currentParams = params;
          buildTable();
        },
      });

      container.replaceChildren(
        PageHeader({
          title: 'Solicitudes',
          description: 'Revisa, aprueba o rechaza las solicitudes de pedido recibidas.',
          breadcrumb: [{ label: 'Solicitudes' }],
        }),
        filtersHandle.element,
        tableSlot,
      );

      buildTable();
    } catch (error) {
      await showApiError(error);
    }
  }

  function sucursalLabel(sucursalId: string): string {
    return sucursalLabelById.get(sucursalId) ?? sucursalId;
  }

  function buildTable(): void {
    const columns: DataTableColumn<SolicitudPedido>[] = [
      { key: 'id', header: 'ID' },
      {
        key: 'creadoEn',
        header: 'Fecha',
        render: (row) => dayjs(row.creadoEn).format('DD/MM/YYYY HH:mm'),
      },
      { key: 'nombreCompleto', header: 'Cliente' },
      { key: 'telefono', header: 'Telefono' },
      {
        key: 'sucursalId',
        header: 'Sucursal',
        render: (row) => sucursalLabel(row.sucursalId),
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (row) =>
          Badge({
            label: ESTADO_SOLICITUD_PEDIDO_LABEL[row.estado],
            variant: ESTADO_SOLICITUD_PEDIDO_BADGE_VARIANT[row.estado],
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
          if (row.estado === 'pendiente') {
            actions.push(
              { label: 'Aprobar', icon: Check, onSelect: () => void handleAprobar(row) },
              {
                label: 'Rechazar',
                icon: X,
                danger: true,
                onSelect: () => openRechazarModal(row),
              },
            );
          }
          return RowActions(actions);
        },
      },
    ];

    table = ResourceTable({
      columns,
      getRowKey: (row) => row.id,
      fetchPage: (params) =>
        SolicitudesService.listar({
          page: params.page,
          limit: params.limit,
          estado: (currentParams.estado as EstadoSolicitudPedido) || undefined,
          tiendaId: currentParams.tiendaId ? Number(currentParams.tiendaId) : undefined,
          fechaDesde: currentParams.fechaDesde,
          fechaHasta: currentParams.fechaHasta,
        }),
      emptyTitle: 'Sin solicitudes registradas',
      emptyDescription: 'No hay solicitudes que coincidan con los filtros seleccionados.',
    });

    tableSlot.replaceChildren(table.element);
  }

  async function openDetailModal(solicitud: SolicitudPedido): Promise<void> {
    const fields = [
      { label: 'Cliente', value: solicitud.nombreCompleto },
      { label: 'Telefono', value: solicitud.telefono },
      { label: 'Direccion', value: solicitud.direccionEntrega },
      { label: 'Sucursal', value: sucursalLabel(solicitud.sucursalId) },
      {
        label: 'Descripcion del producto',
        value: formatOptional(solicitud.descripcionProducto),
      },
      { label: 'Valor del producto', value: formatMonto(solicitud.valorProducto) },
      { label: 'Costo de envio', value: formatMonto(solicitud.costoEnvio) },
      { label: 'Observaciones', value: formatOptional(solicitud.observaciones) },
      {
        label: 'Estado',
        value: Badge({
          label: ESTADO_SOLICITUD_PEDIDO_LABEL[solicitud.estado],
          variant: ESTADO_SOLICITUD_PEDIDO_BADGE_VARIANT[solicitud.estado],
        }),
      },
      { label: 'Fecha de creacion', value: dayjs(solicitud.creadoEn).format('DD/MM/YYYY HH:mm') },
    ];

    if (solicitud.estado === 'rechazada') {
      fields.push({ label: 'Motivo del rechazo', value: formatOptional(solicitud.motivoRechazo) });
    }

    const codigoPedidoSlot =
      solicitud.estado === 'aprobada' && solicitud.pedidoId
        ? el('span', {}, 'Cargando...')
        : null;
    if (codigoPedidoSlot) {
      fields.push({ label: 'Pedido generado', value: codigoPedidoSlot });
    }

    const modal = Modal({
      title: 'Detalle de solicitud',
      content: DetailList({ fields }),
      footer: Button({ label: 'Cerrar', variant: 'secondary', onClick: () => modal.close() }),
      onClose: () => modal.destroy(),
    });
    modal.open();

    if (codigoPedidoSlot && solicitud.pedidoId) {
      try {
        const pedido = await PedidosService.buscarPorId(solicitud.pedidoId);
        codigoPedidoSlot.textContent = pedido.codigoPedido;
      } catch {
        codigoPedidoSlot.textContent = SIN_VALOR_LABEL;
      }
    }
  }

  async function handleAprobar(solicitud: SolicitudPedido): Promise<void> {
    const confirmed = await confirmDialog({
      title: 'Aprobar solicitud',
      text: `¿Confirmas aprobar la solicitud de "${solicitud.nombreCompleto}"? Se creara el Pedido correspondiente.`,
      icon: 'question',
      confirmText: 'Aprobar',
    });
    if (!confirmed) return;

    const usuarioId = Number(SessionService.getCurrentUser()?.id);
    try {
      await SolicitudesService.aprobar(solicitud.id, { usuarioId });
      showSuccessToast('Solicitud aprobada correctamente');
      table?.reload();
    } catch (error) {
      await showApiError(error);
    }
  }

  function openRechazarModal(solicitud: SolicitudPedido): void {
    const motivoField = Textarea({
      name: 'motivoRechazo',
      label: 'Motivo del rechazo',
      required: true,
    });
    const modal = FormModal({
      title: 'Rechazar solicitud',
      content: el('div', { className: 'flex flex-col gap-4' }, motivoField.wrapper),
      submitLabel: 'Rechazar',
      onSubmit: async () => {
        const motivoRechazo = motivoField.textarea.value.trim();
        if (!motivoRechazo) {
          motivoField.setError('Ingresa el motivo del rechazo');
          return false;
        }
        try {
          await SolicitudesService.rechazar(solicitud.id, { motivoRechazo });
          showSuccessToast('Solicitud rechazada');
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

  async function showApiError(error: unknown): Promise<void> {
    const message =
      error instanceof HttpError ? error.message : 'No se pudo conectar con el servidor.';
    await infoAlert({ title: 'No se pudo completar la accion', text: message, icon: 'error' });
  }

  return container;
}
