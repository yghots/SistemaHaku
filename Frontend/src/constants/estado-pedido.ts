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

/**
 * Paleta de badges (Fase 21, tema Midnight): pendiente=gris, asignado=azul,
 * en_ruta=naranja, entregado=verde, cancelado=rojo, cliente_ausente=ambar,
 * rechazado=rojo oscuro (variante `dangerStrong`, distinta de `cancelado`
 * para diferenciar visualmente ambos estados negativos). `recogido` y
 * `reprogramado` no estaban en la paleta explicita — se mantienen en la
 * familia mas cercana ya usada (info/warning) sin inventar un color nuevo.
 */
export const ESTADO_PEDIDO_BADGE_VARIANT: Record<EstadoPedido, BadgeVariant> = {
  pendiente: 'neutral',
  asignado: 'brand',
  recogido: 'info',
  en_ruta: 'warning',
  entregado: 'success',
  cancelado: 'danger',
  reprogramado: 'warning',
  devuelto: 'danger',
  rechazado: 'dangerStrong',
  cliente_ausente: 'warning',
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
