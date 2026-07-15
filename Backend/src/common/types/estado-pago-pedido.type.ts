/**
 * Estado de pago de un pedido para listados/reportes (Fase 21) — mas
 * granular que `ResumenPagoPedidoDto.estadoPago` del modulo Pagos (que
 * solo distingue "pagado"/"pendiente"): aqui se distingue ademas "sin
 * ningun pago" de "con pago parcial", una necesidad de visualizacion en
 * tablas/reportes, no una regla de negocio nueva del modulo Pagos (que
 * permanece intacto).
 */
export type EstadoPagoPedido = 'sin_pago' | 'pago_parcial' | 'pagado';
