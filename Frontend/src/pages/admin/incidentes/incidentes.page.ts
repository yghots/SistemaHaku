import { Eye } from 'lucide';
import { Badge } from '../../../components/badge/badge';
import { Button } from '../../../components/button/button';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import { RowActions } from '../../../components/datatable/row-actions';
import { DetailList } from '../../../components/detail-list/detail-list';
import { Modal } from '../../../components/modal/modal';
import { PageHeader } from '../../../components/page-header/page-header';
import {
  ResourceTable,
  type ResourceTableHandle,
} from '../../../components/resource-table/resource-table';
import { IncidentesService } from '../../../services/incidentes.service';
import { MotorizadosService } from '../../../services/motorizados.service';
import type { Incidente, TipoIncidente } from '../../../types/incidente';
import { el } from '../../../utils/dom';
import { formatMotorizado } from '../../../utils/format-motorizado';

const TIPO_INCIDENTE_LABEL: Record<TipoIncidente, string> = {
  accidente: 'Accidente',
  averia: 'Averia',
  dano_producto: 'Dano al producto',
  otro: 'Otro',
};

/**
 * Pagina de Incidentes: solo lectura, igual que el backend (CRUD parcial
 * a proposito — solo crear/consultar/listar, sin PATCH/DELETE). Registrar
 * un incidente es una accion del Motorizado (ver pages/rider/mis-pedidos),
 * no de este panel.
 */
export function IncidentesPage(): HTMLElement {
  let motorizadoLabelById = new Map<string, string>();

  function motorizadoLabel(motorizadoId: string): string {
    return motorizadoLabelById.get(motorizadoId) ?? motorizadoId;
  }

  const columns: DataTableColumn<Incidente>[] = [
    { key: 'id', header: 'ID' },
    {
      key: 'pedidoId',
      header: 'Pedido',
      render: (row) => (row.pedidoId ? `#${row.pedidoId}` : '—'),
    },
    {
      key: 'motorizadoId',
      header: 'Motorizado',
      render: (row) => motorizadoLabel(row.motorizadoId),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (row) => Badge({ label: TIPO_INCIDENTE_LABEL[row.tipo] }),
    },
    {
      key: 'resuelto',
      header: 'Resuelto',
      render: (row) =>
        row.resuelto
          ? Badge({ label: 'Si', variant: 'success' })
          : Badge({ label: 'No', variant: 'warning' }),
    },
    {
      key: 'id',
      header: '',
      className: 'text-right',
      render: (row) =>
        RowActions([{ label: 'Ver detalle', icon: Eye, onSelect: () => openDetailModal(row) }]),
    },
  ];

  const table: ResourceTableHandle = ResourceTable<Incidente, { tipo: string; resuelto: string }>({
    columns,
    getRowKey: (row) => row.id,
    fetchPage: (params) =>
      IncidentesService.listar({
        page: params.page,
        limit: params.limit,
        tipo: (params.tipo as TipoIncidente) || undefined,
        resuelto: params.resuelto ? params.resuelto === 'true' : undefined,
      }),
    filterFields: [
      {
        type: 'select',
        name: 'tipo',
        placeholder: 'Todos los tipos',
        options: Object.entries(TIPO_INCIDENTE_LABEL).map(([value, label]) => ({ value, label })),
      },
      {
        type: 'select',
        name: 'resuelto',
        placeholder: 'Todos',
        options: [
          { value: 'true', label: 'Resuelto' },
          { value: 'false', label: 'Pendiente' },
        ],
      },
    ],
    emptyTitle: 'Sin incidentes registrados',
    emptyDescription: 'Los motorizados registran incidentes desde su propio panel.',
  });

  void MotorizadosService.listar({ page: 1, limit: 100 }).then((response) => {
    motorizadoLabelById = new Map(
      response.data.map((motorizado) => [motorizado.id, formatMotorizado(motorizado)]),
    );
    table.reload();
  });

  function openDetailModal(incidente: Incidente): void {
    const modal = Modal({
      title: 'Detalle de incidente',
      content: DetailList({
        fields: [
          { label: 'ID', value: incidente.id },
          { label: 'Pedido', value: incidente.pedidoId ? `#${incidente.pedidoId}` : '—' },
          { label: 'Motorizado', value: motorizadoLabel(incidente.motorizadoId) },
          { label: 'Tipo', value: TIPO_INCIDENTE_LABEL[incidente.tipo] },
          { label: 'Resuelto', value: incidente.resuelto ? 'Si' : 'No' },
        ],
      }),
      footer: Button({ label: 'Cerrar', variant: 'secondary', onClick: () => modal.close() }),
      onClose: () => modal.destroy(),
    });
    modal.open();
  }

  return el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Incidentes',
      description: 'Consulta los incidentes reportados por los motorizados.',
      breadcrumb: [{ label: 'Incidentes' }],
    }),
    table.element,
  );
}
