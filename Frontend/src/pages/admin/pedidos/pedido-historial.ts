import dayjs from 'dayjs';
import { Badge } from '../../../components/badge/badge';
import { DataTable, type DataTableColumn } from '../../../components/datatable/datatable';
import { ESTADO_PEDIDO_BADGE_VARIANT, ESTADO_PEDIDO_LABEL } from '../../../constants/estado-pedido';
import type { HistorialPedido, TipoEventoHistorial } from '../../../types/historial-pedido';
import { SIN_VALOR_LABEL } from '../../../utils/format-optional';

const TIPO_EVENTO_LABEL: Record<TipoEventoHistorial, string> = {
  cambio_estado: 'Cambio de estado',
  reasignacion: 'Reasignacion de motorizado',
};

/**
 * Tabla de eventos del historial de un pedido. Reutilizada por el
 * "Ver detalle" de Pedidos (Admin) y por el detalle de pedido del panel
 * del Motorizado — no se crea una vista de historial por panel.
 *
 * `motorizadoLabel` (Fase 17, obligatorio): resuelve el id de motorizado
 * de un evento de reasignacion a su representacion completa
 * ("Nombre Completo · Placa", vía `formatMotorizado`) — nunca se muestra
 * unicamente el id. Cada llamador es responsable de tener ya cargada la
 * lista de motorizados (`MotorizadosService.listar`) y construir este
 * resolver, igual que ya hace para `clienteLabel`/`sucursalLabel` en sus
 * propias tablas.
 */
export function PedidoHistorial(
  eventos: HistorialPedido[],
  motorizadoLabel: (motorizadoId: string) => string,
): HTMLElement {
  const columns: DataTableColumn<HistorialPedido>[] = [
    { key: 'tipoEvento', header: 'Evento', render: (row) => TIPO_EVENTO_LABEL[row.tipoEvento] },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) =>
        row.estado
          ? Badge({
              label: ESTADO_PEDIDO_LABEL[row.estado],
              variant: ESTADO_PEDIDO_BADGE_VARIANT[row.estado],
            })
          : SIN_VALOR_LABEL,
    },
    {
      key: 'motorizadoId',
      header: 'Motorizado',
      render: (row) => (row.motorizadoId ? motorizadoLabel(row.motorizadoId) : SIN_VALOR_LABEL),
    },
    { key: 'usuarioId', header: 'Registrado por', render: (row) => `#${row.usuarioId}` },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (row) => dayjs(row.createdAt).format('DD/MM/YYYY HH:mm'),
    },
  ];

  return DataTable({
    columns,
    rows: eventos,
    getRowKey: (row) => row.id,
    emptyTitle: 'Sin eventos registrados',
    emptyDescription: 'Este pedido todavia no tiene eventos en su historial.',
  });
}
