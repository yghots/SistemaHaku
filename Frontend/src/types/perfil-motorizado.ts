/**
 * Contrato exacto de Backend/src/modules/perfiles-motorizados (revisado
 * directamente en el codigo fuente antes de escribir estos tipos:
 * create-perfil-motorizado.dto.ts, update-perfil-motorizado.dto.ts,
 * perfil-motorizado-response.dto.ts, list-perfiles-motorizados-query.dto.ts,
 * y el enum `EstadoMotorizado` de prisma/schema.prisma).
 *
 * `usuarioId` es inmutable tras la creacion (el backend lo excluye
 * explicitamente de UpdatePerfilMotorizadoDto vía OmitType) — el formulario
 * de edicion nunca debe permitir cambiarlo.
 */

export type EstadoMotorizado = 'disponible' | 'ocupado' | 'inactivo';

/** Igual a PerfilMotorizadoResponseDto (`nombres`/`apellidos` del usuario asociado, incorporados en la Fase 17). */
export interface PerfilMotorizado {
  id: string;
  usuarioId: string;
  nombres: string;
  apellidos: string;
  placa: string;
  estado: EstadoMotorizado;
}

/** Igual a CreatePerfilMotorizadoDto. */
export interface CreatePerfilMotorizadoPayload {
  usuarioId: number;
  placa: string;
  estado: EstadoMotorizado;
}

/** Igual a UpdatePerfilMotorizadoDto: solo placa/estado, ambos opcionales. */
export interface UpdatePerfilMotorizadoPayload {
  placa?: string;
  estado?: EstadoMotorizado;
}

/** Igual a ListPerfilesMotorizadosQueryDto. */
export interface ListPerfilesMotorizadosParams {
  page: number;
  limit: number;
  usuarioId?: number;
  estado?: EstadoMotorizado;
  placa?: string;
}
