/**
 * Contrato exacto de Backend/src/modules/tiendas (revisado directamente en
 * el codigo fuente: create-tienda.dto.ts, update-tienda.dto.ts,
 * tienda-response.dto.ts, list-tiendas-query.dto.ts).
 */

/** Igual a TiendaResponseDto. */
export interface Tienda {
  id: string;
  nombre: string;
  ruc: string | null;
  activo: boolean;
}

/** Igual a CreateTiendaDto (nombre: requerido, maxLength 150; ruc: opcional, maxLength 20). */
export interface CreateTiendaPayload {
  nombre: string;
  ruc?: string;
}

/** Igual a UpdateTiendaDto = PartialType(CreateTiendaDto). */
export interface UpdateTiendaPayload {
  nombre?: string;
  ruc?: string;
}

/** Igual a ListTiendasQueryDto: solo `nombre` es filtrable (coincidencia parcial). */
export interface ListTiendasParams {
  page: number;
  limit: number;
  nombre?: string;
}
