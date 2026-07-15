import { calcularResumenPago } from '../../modules/pagos/pagos-calculo.util';
import type { EstadoPagoPedido } from '../types/estado-pago-pedido.type';

export interface ResumenPagoPedidoCalculado {
  totalPedido: number;
  totalPagado: number;
  saldoPendiente: number;
  estadoPago: EstadoPagoPedido;
}

/**
 * Unico punto donde Pedidos y Reportes (Fase 21) derivan el estado de pago
 * de 3 valores (`sin_pago`/`pago_parcial`/`pagado`) usado en tablas y
 * reportes — reutiliza `calcularResumenPago` del modulo Pagos (Fase 20,
 * sin modificarlo) para el saldo y el binario pagado/pendiente, y solo
 * agrega la distincion "sin_pago" cuando el total pagado es exactamente 0.
 * No duplica ningun calculo: es la misma aritmetica de Pagos, leida desde
 * afuera.
 */
export function calcularEstadoPagoPedido(
  totalPedido: number,
  totalPagado: number,
): ResumenPagoPedidoCalculado {
  const base = calcularResumenPago(totalPedido, totalPagado);
  const estadoPago: EstadoPagoPedido =
    totalPagado === 0
      ? 'sin_pago'
      : base.estadoPago === 'pagado'
        ? 'pagado'
        : 'pago_parcial';

  return { ...base, estadoPago };
}
