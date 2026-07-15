/**
 * Contrato exacto de Backend/src/modules/pagos (Fase 20, revisado
 * directamente en crear-pago.dto.ts, pago-response.dto.ts,
 * resumen-pago-pedido.dto.ts y el enum `MetodoPago` de prisma/schema.prisma).
 * Modulo de solo registro + consulta: un pago es un registro historico
 * inmutable, no existe edicion ni eliminacion.
 */

export type MetodoPago = 'efectivo' | 'yape' | 'plin' | 'transferencia' | 'tarjeta';

export const METODOS_PAGO: MetodoPago[] = ['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'];

/** Igual a PagoResponseDto. */
export interface Pago {
  id: string;
  pedidoId: string;
  metodoPago: MetodoPago;
  monto: string;
  montoRecibido: string | null;
  vuelto: string | null;
  observacion: string | null;
  creadoPorId: string;
  creadoEn: string;
}

/** Igual a CrearPagoDto. */
export interface CrearPagoPayload {
  metodoPago: MetodoPago;
  monto: number;
  montoRecibido?: number;
  observacion?: string;
  creadoPorId: number;
}

/** Igual a ResumenPagoPedidoDto — nunca persistido, siempre calculado por el backend a partir de los pagos registrados. */
export interface ResumenPagoPedido {
  pedidoId: string;
  totalPedido: string;
  totalPagado: string;
  saldoPendiente: string;
  estadoPago: 'pagado' | 'pendiente';
}
