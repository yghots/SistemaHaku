import dayjs from 'dayjs';
import { Badge } from '../../../components/badge/badge';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import { ESTADO_PEDIDO_BADGE_VARIANT, ESTADO_PEDIDO_LABEL } from '../../../constants/estado-pedido';
import type { ReportePedidoItem } from '../../../types/reporte';

export interface ReportePedidoLabels {
  clienteLabel: (clienteId: string) => string;
  motorizadoLabel: (motorizadoId: string) => string;
}

/**
 * Columnas compartidas por el Reporte de Pedidos y el Reporte de
 * Entregas: ambos endpoints devuelven exactamente la misma forma de fila
 * (`ReportePedidoItemDto`) — se construyen una sola vez aqui para no
 * duplicar la definicion de columnas entre las dos paginas.
 */
export function buildReportePedidoColumns({
  clienteLabel,
  motorizadoLabel,
}: ReportePedidoLabels): DataTableColumn<ReportePedidoItem>[] {
  return [
    { key: 'codigoPedido', header: 'Codigo' },
    { key: 'tiendaNombre', header: 'Tienda' },
    { key: 'sucursalNombre', header: 'Sucursal' },
    { key: 'clienteId', header: 'Cliente', render: (row) => clienteLabel(row.clienteId) },
    {
      key: 'motorizadoActualId',
      header: 'Motorizado',
      render: (row) => (row.motorizadoActualId ? motorizadoLabel(row.motorizadoActualId) : '—'),
    },
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
  ];
}
