/**
 * Contrato exacto de Backend/src/modules/fotos-entrega (revisado
 * directamente en foto-entrega-response.dto.ts y el enum `TipoFoto` de
 * prisma/schema.prisma). Modulo de solo lectura: las fotos unicamente se
 * registran durante Confirmar Recojo/Entrega (flujo-pedido), no existe
 * creacion/edicion/eliminacion directa vía este recurso.
 */

export type TipoFoto = 'recojo' | 'entrega';

/** Igual a FotoEntregaResponseDto. */
export interface FotoEntrega {
  id: string;
  pedidoId: string;
  motorizadoId: string;
  tipo: TipoFoto;
  urlImagen: string;
  esPrincipal: boolean;
}
