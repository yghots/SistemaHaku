import type { BadgeVariant } from '../components/badge/badge';
import type { EstadoSolicitudPedido } from '../types/solicitud-pedido';

/**
 * Mapeo de UI para `EstadoSolicitudPedido`, mismo criterio ya usado en
 * `constants/estado-pedido.ts`: pendiente=neutral, aprobada=success
 * (equivalente a "entregado"), rechazada=dangerStrong (mismo variant que
 * "rechazado" en Pedido).
 */
export const ESTADO_SOLICITUD_PEDIDO_LABEL: Record<EstadoSolicitudPedido, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

export const ESTADO_SOLICITUD_PEDIDO_BADGE_VARIANT: Record<EstadoSolicitudPedido, BadgeVariant> = {
  pendiente: 'neutral',
  aprobada: 'success',
  rechazada: 'dangerStrong',
};
