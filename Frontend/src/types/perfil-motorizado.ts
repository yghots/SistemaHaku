/**
 * Contrato exacto de Backend/src/modules/perfiles-motorizados (revisado
 * directamente en el codigo fuente antes de escribir estos tipos:
 * create-perfil-motorizado.dto.ts, update-perfil-motorizado.dto.ts,
 * perfil-motorizado-response.dto.ts, list-perfiles-motorizados-query.dto.ts).
 *
 * `usuarioId` es inmutable tras la creacion (el backend lo excluye
 * explicitamente de UpdatePerfilMotorizadoDto vía OmitType) — el formulario
 * de edicion nunca debe permitir cambiarlo.
 *
 * `estado` (EstadoMotorizado) eliminado en la Fase 33 (rediseno de ciclo de
 * vida de Usuarios y Motorizados) — nunca participo en ninguna regla de
 * negocio; el estado operativo real de un motorizado se deriva ahora
 * unicamente de `Usuario.activo`.
 */

/** Igual a PerfilMotorizadoResponseDto (`nombres`/`apellidos` del usuario asociado, incorporados en la Fase 17). */
export interface PerfilMotorizado {
  id: string;
  usuarioId: string;
  nombres: string;
  apellidos: string;
  placa: string;
}

/** Igual a CreatePerfilMotorizadoDto. */
export interface CreatePerfilMotorizadoPayload {
  usuarioId: number;
  placa: string;
}

/** Igual a UpdatePerfilMotorizadoDto: solo placa, opcional. */
export interface UpdatePerfilMotorizadoPayload {
  placa?: string;
}

/** Igual a ListPerfilesMotorizadosQueryDto. */
export interface ListPerfilesMotorizadosParams {
  page: number;
  limit: number;
  usuarioId?: number;
  placa?: string;
}
