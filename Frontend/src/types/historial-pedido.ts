import type { EstadoPedido } from './pedido';

/**
 * Contrato exacto de Backend/src/modules/historial-pedido (revisado
 * directamente en historial-pedido-response.dto.ts y el enum
 * `TipoEventoHistorial` de prisma/schema.prisma). Modulo de solo lectura:
 * el historial se genera unicamente desde el flujo de Pedido, no existe
 * creacion/edicion/eliminacion vía API.
 */

export type TipoEventoHistorial = 'cambio_estado' | 'reasignacion';

/** Igual a HistorialPedidoResponseDto. */
export interface HistorialPedido {
  id: string;
  pedidoId: string;
  tipoEvento: TipoEventoHistorial;
  estado: EstadoPedido | null;
  motorizadoId: string | null;
  usuarioId: string;
  createdAt: string;
}
