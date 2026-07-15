import dayjs from 'dayjs';
import { Badge } from '../../../components/badge/badge';
import type { DataTableColumn } from '../../../components/datatable/datatable';
import {
  ESTADO_PAGO_PEDIDO_BADGE_VARIANT,
  ESTADO_PAGO_PEDIDO_LABEL,
} from '../../../constants/estado-pago-pedido';
import { ESTADO_PEDIDO_BADGE_VARIANT, ESTADO_PEDIDO_LABEL } from '../../../constants/estado-pedido';
import type { ReportePedidoItem } from '../../../types/reporte';
import { formatMonto } from '../../../utils/format-monto';
import { SIN_VALOR_LABEL } from '../../../utils/format-optional';
import { METODO_PAGO_LABEL } from '../pedidos/pedido-pago-form';

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
      render: (row) =>
        row.motorizadoActualId ? motorizadoLabel(row.motorizadoActualId) : SIN_VALOR_LABEL,
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

/** Columna compartida por ambos reportes (Fase 21): metodos de pago usados en el pedido, sin duplicados. */
function metodosUtilizadosColumn(): DataTableColumn<ReportePedidoItem> {
  return {
    key: 'metodosUtilizados',
    header: 'Metodos utilizados',
    render: (row) =>
      row.metodosUtilizados.length > 0
        ? row.metodosUtilizados.map((metodo) => METODO_PAGO_LABEL[metodo]).join(', ')
        : SIN_VALOR_LABEL,
  };
}

/** Columnas adicionales del Reporte de Pedidos (Fase 21): Total pagado, Saldo pendiente y Metodos utilizados — siempre valores ya calculados por el backend. */
export function buildReportePedidosPagoColumns(): DataTableColumn<ReportePedidoItem>[] {
  return [
    { key: 'totalPagado', header: 'Total pagado', render: (row) => formatMonto(row.totalPagado) },
    {
      key: 'saldoPendiente',
      header: 'Saldo pendiente',
      render: (row) => formatMonto(row.saldoPendiente),
    },
    metodosUtilizadosColumn(),
  ];
}

/** Columnas adicionales del Reporte de Entregas (Fase 21): Estado de pago y Metodos utilizados. */
export function buildReporteEntregasPagoColumns(): DataTableColumn<ReportePedidoItem>[] {
  return [
    {
      key: 'estadoPago',
      header: 'Estado de pago',
      render: (row) =>
        Badge({
          label: ESTADO_PAGO_PEDIDO_LABEL[row.estadoPago],
          variant: ESTADO_PAGO_PEDIDO_BADGE_VARIANT[row.estadoPago],
        }),
    },
    metodosUtilizadosColumn(),
  ];
}
