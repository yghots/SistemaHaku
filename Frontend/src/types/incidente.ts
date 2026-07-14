/**
 * Contrato exacto de Backend/src/modules/incidentes (revisado
 * directamente en create-incidente.dto.ts, incidente-response.dto.ts,
 * list-incidentes-query.dto.ts, y el enum `TipoIncidente` de
 * prisma/schema.prisma). CRUD parcial a proposito: solo crear, consultar
 * y listar — no hay PATCH ni DELETE (no existe forma de marcar
 * `resuelto` vía API).
 */

export type TipoIncidente = 'accidente' | 'averia' | 'dano_producto' | 'otro';

/** Igual a IncidenteResponseDto. */
export interface Incidente {
  id: string;
  pedidoId: string | null;
  motorizadoId: string;
  tipo: TipoIncidente;
  resuelto: boolean;
}

/** Igual a CreateIncidenteDto. `pedidoId` es opcional: un incidente puede no estar ligado a un pedido (ej. falla del vehiculo). */
export interface CreateIncidentePayload {
  pedidoId?: number;
  motorizadoId: number;
  tipo: TipoIncidente;
}

/** Igual a ListIncidentesQueryDto. */
export interface ListIncidentesParams {
  page: number;
  limit: number;
  pedidoId?: number;
  motorizadoId?: number;
  tipo?: TipoIncidente;
  resuelto?: boolean;
}
