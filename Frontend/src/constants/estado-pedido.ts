import type { BadgeVariant } from '../components/badge/badge';
import type { EstadoPedido } from '../types/pedido';

/**
 * Mapeo de UI para `EstadoPedido`, compartido por el modulo Pedidos
 * (Admin) y el panel del Motorizado — evita duplicar el mismo mapa de
 * etiquetas/colores en cada pagina que muestra un estado de pedido.
 */
export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  recogido: 'Recogido',
  en_ruta: 'En ruta',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  reprogramado: 'Reprogramado',
  devuelto: 'Devuelto',
  rechazado: 'Rechazado',
  cliente_ausente: 'Cliente ausente',
};

export const ESTADO_PEDIDO_BADGE_VARIANT: Record<EstadoPedido, BadgeVariant> = {
  pendiente: 'neutral',
  asignado: 'info',
  recogido: 'info',
  en_ruta: 'warning',
  entregado: 'success',
  cancelado: 'danger',
  reprogramado: 'warning',
  devuelto: 'danger',
  rechazado: 'danger',
  cliente_ausente: 'danger',
};

/** Estados terminales: el pedido ya cerro su ciclo de vida (no admite mas acciones del flujo operativo). */
export const ESTADOS_TERMINALES: EstadoPedido[] = [
  'entregado',
  'cancelado',
  'reprogramado',
  'devuelto',
  'rechazado',
  'cliente_ausente',
];
