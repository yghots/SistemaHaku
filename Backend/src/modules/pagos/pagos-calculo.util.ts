/**
 * Unica fuente de la aritmetica de pagos (Fase 20) — "centralizar la
 * logica de resumen de pagos", nunca duplicar estos calculos en el
 * service, el mapper o el controller. Funciones puras, sin acceso a
 * Prisma ni a ningun otro servicio.
 */

/** Redondea a 2 decimales evitando artefactos de punto flotante (ej. 0.1 + 0.2). */
function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Vuelto de un pago en efectivo. Precondicion (ya validada por el
 * servicio antes de llamar esta funcion): `montoRecibido >= monto`.
 */
export function calcularVuelto(monto: number, montoRecibido: number): number {
  return redondear(montoRecibido - monto);
}

export type EstadoPago = 'pagado' | 'pendiente';

export interface ResumenPagoCalculado {
  totalPedido: number;
  totalPagado: number;
  saldoPendiente: number;
  estadoPago: EstadoPago;
}

/**
 * Total del pedido = valorProducto + costoEnvio (los unicos campos
 * monetarios que expone `Pedido`; ambos opcionales, se tratan como 0 si
 * faltan). Total pagado = suma de `monto` de los pagos registrados —
 * nunca `montoRecibido` (ese campo es solo informativo para el manejo de
 * efectivo, no representa lo efectivamente abonado a la deuda). Saldo
 * pendiente nunca es negativo: un sobrepago dado dado (no rechazado por
 * esta fase, ver DEVELOPMENT_PROGRESS.md) simplemente deja el pedido
 * "pagado" con saldo 0.
 */
export function calcularResumenPago(
  totalPedido: number,
  totalPagado: number,
): ResumenPagoCalculado {
  const totalPedidoRedondeado = redondear(totalPedido);
  const totalPagadoRedondeado = redondear(totalPagado);
  const saldoPendiente = Math.max(
    0,
    redondear(totalPedidoRedondeado - totalPagadoRedondeado),
  );
  const estadoPago: EstadoPago =
    totalPagadoRedondeado >= totalPedidoRedondeado ? 'pagado' : 'pendiente';

  return {
    totalPedido: totalPedidoRedondeado,
    totalPagado: totalPagadoRedondeado,
    saldoPendiente,
    estadoPago,
  };
}
