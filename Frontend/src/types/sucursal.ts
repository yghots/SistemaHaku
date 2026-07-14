/**
 * Contrato exacto de Backend/src/modules/sucursales (revisado
 * directamente en el codigo fuente: create-sucursal.dto.ts,
 * update-sucursal.dto.ts, sucursal-response.dto.ts,
 * list-sucursales-query.dto.ts). Sucursal NO tiene campo `activo` (a
 * diferencia de Tienda/Usuario) - no hay activar/desactivar en el backend,
 * por eso no se implementa en el frontend.
 */

/** Igual a SucursalResponseDto. */
export interface Sucursal {
  id: string;
  tiendaId: string;
  nombre: string;
  direccion: string;
  referencia: string | null;
  telefono: string;
  esPrincipal: boolean;
}

/** Igual a CreateSucursalDto (tiendaId/nombre/direccion/telefono requeridos, referencia/esPrincipal opcionales). */
export interface CreateSucursalPayload {
  tiendaId: number;
  nombre: string;
  direccion: string;
  referencia?: string;
  telefono: string;
  esPrincipal?: boolean;
}

/** Igual a UpdateSucursalDto = PartialType(CreateSucursalDto). */
export interface UpdateSucursalPayload {
  tiendaId?: number;
  nombre?: string;
  direccion?: string;
  referencia?: string;
  telefono?: string;
  esPrincipal?: boolean;
}

/** Igual a ListSucursalesQueryDto: `tiendaId` (exacto) y `nombre` (coincidencia parcial) son filtrables. */
export interface ListSucursalesParams {
  page: number;
  limit: number;
  tiendaId?: number;
  nombre?: string;
}
