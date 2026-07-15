/**
 * Contrato exacto de Backend/src/modules/fotos-entrega (revisado
 * directamente en foto-entrega-response.dto.ts y el enum `TipoFoto` de
 * prisma/schema.prisma). Modulo de solo lectura: las fotos unicamente se
 * registran durante Confirmar Recojo/Entrega (flujo-pedido), no existe
 * creacion/edicion/eliminacion directa vía este recurso.
 *
 * Fase 22: las fotografias se almacenan directamente en MySQL (LONGBLOB),
 * nunca como URL — el binario se sirve por separado
 * (`GET /pedidos/:id/fotos/:fotoId/imagen`, ver `utils/foto-entrega-url.ts`),
 * esta metadata solo trae `mimeType`.
 */

export type TipoFoto = 'recojo' | 'entrega';

/** Igual a FotoEntregaResponseDto. */
export interface FotoEntrega {
  id: string;
  pedidoId: string;
  motorizadoId: string;
  tipo: TipoFoto;
  mimeType: string;
  esPrincipal: boolean;
}
