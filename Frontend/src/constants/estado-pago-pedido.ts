import type { BadgeVariant } from '../components/badge/badge';
import type { EstadoPagoPedido } from '../types/pedido';

/**
 * Mapeo de UI para `EstadoPagoPedido` (Fase 21), compartido por la tabla de
 * Pedidos y el Reporte de Entregas — evita duplicar el mismo mapa de
 * etiquetas/colores en cada pantalla que muestra el estado de pago de un
 * pedido. El valor en si siempre viene ya calculado por el backend (nunca
 * recalculado aqui).
 */
export const ESTADO_PAGO_PEDIDO_LABEL: Record<EstadoPagoPedido, string> = {
  sin_pago: 'Sin pago',
  pago_parcial: 'Pago parcial',
  pagado: 'Pagado',
};

export const ESTADO_PAGO_PEDIDO_BADGE_VARIANT: Record<EstadoPagoPedido, BadgeVariant> = {
  sin_pago: 'neutral',
  pago_parcial: 'warning',
  pagado: 'success',
};
