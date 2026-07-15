import dayjs from 'dayjs';
import { Badge } from '../../../components/badge/badge';
import { DataTable, type DataTableColumn } from '../../../components/datatable/datatable';
import { DetailList } from '../../../components/detail-list/detail-list';
import type { Pago, ResumenPagoPedido } from '../../../types/pago';
import { el } from '../../../utils/dom';
import { formatMonto } from '../../../utils/format-monto';
import { formatOptional } from '../../../utils/format-optional';
import { METODO_PAGO_LABEL } from './pedido-pago-form';

/**
 * Resumen + historial de pagos de un pedido (Fase 20). Reutilizada
 * unicamente por el "Ver detalle" de Pedidos (Admin) — no existe pantalla
 * independiente de Pagos, tal como pide la fase. `usuarioLabel` resuelve
 * `creadoPorId` a nombre completo (mismo patron que `motorizadoLabel` en
 * `PedidoHistorial`, Fase 17: nunca identificar a una persona solo por id).
 */
export function PedidoPagos(
  resumen: ResumenPagoPedido,
  pagos: Pago[],
  usuarioLabel: (usuarioId: string) => string,
): HTMLElement {
  const columns: DataTableColumn<Pago>[] = [
    {
      key: 'creadoEn',
      header: 'Fecha',
      render: (row) => dayjs(row.creadoEn).format('DD/MM/YYYY HH:mm'),
    },
    { key: 'creadoPorId', header: 'Usuario', render: (row) => usuarioLabel(row.creadoPorId) },
    { key: 'metodoPago', header: 'Metodo', render: (row) => METODO_PAGO_LABEL[row.metodoPago] },
    { key: 'monto', header: 'Monto', render: (row) => formatMonto(row.monto) },
    { key: 'observacion', header: 'Observacion', render: (row) => formatOptional(row.observacion) },
  ];

  return el(
    'div',
    { className: 'flex flex-col gap-4' },
    DetailList({
      fields: [
        { label: 'Total del pedido', value: formatMonto(resumen.totalPedido) },
        { label: 'Total pagado', value: formatMonto(resumen.totalPagado) },
        { label: 'Saldo pendiente', value: formatMonto(resumen.saldoPendiente) },
        {
          label: 'Estado',
          value: Badge({
            label: resumen.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente de pago',
            variant: resumen.estadoPago === 'pagado' ? 'success' : 'warning',
          }),
        },
      ],
    }),
    DataTable({
      columns,
      rows: pagos,
      getRowKey: (row) => row.id,
      emptyTitle: 'Sin pagos registrados',
      emptyDescription: 'Este pedido todavia no tiene pagos registrados.',
    }),
  );
}
