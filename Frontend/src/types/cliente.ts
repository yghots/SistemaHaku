/**
 * Contrato exacto de Backend/src/modules/clientes (revisado directamente en
 * el codigo fuente antes de escribir estos tipos: create-cliente.dto.ts,
 * update-cliente.dto.ts, cliente-response.dto.ts, list-clientes-query.dto.ts).
 * No hay campo `activo`: Cliente no soporta activar/desactivar, solo
 * eliminacion logica (`deletedAt`, nunca expuesto en la respuesta).
 */

/** Igual a ClienteResponseDto. */
export interface Cliente {
  id: string;
  nombreCompleto: string;
  telefono: string;
  direccion: string;
  documentoIdentidad: string | null;
}

/** Igual a CreateClienteDto (nombreCompleto: maxLength 150, telefono: maxLength 20, direccion: maxLength 255, documentoIdentidad: opcional, maxLength 20). */
export interface CreateClientePayload {
  nombreCompleto: string;
  telefono: string;
  direccion: string;
  documentoIdentidad?: string;
}

/** Igual a UpdateClienteDto = PartialType(CreateClienteDto): todos los campos opcionales. */
export interface UpdateClientePayload {
  nombreCompleto?: string;
  telefono?: string;
  direccion?: string;
  documentoIdentidad?: string;
}

/** Igual a ListClientesQueryDto: 3 filtros de coincidencia parcial, combinados con AND. */
export interface ListClientesParams {
  page: number;
  limit: number;
  nombre?: string;
  telefono?: string;
  documentoIdentidad?: string;
}
