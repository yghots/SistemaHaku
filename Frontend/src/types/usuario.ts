import type { UserRole } from './auth';

/**
 * Contrato exacto de Backend/src/modules/usuarios (revisado directamente
 * en el codigo fuente antes de escribir estos tipos: create-usuario.dto.ts,
 * update-usuario.dto.ts, usuario-response.dto.ts, list-usuarios-query.dto.ts).
 * No agregar propiedades que el backend no exponga (ej. deletedAt: nunca
 * se devuelve en las respuestas).
 */

/** Igual a UsuarioResponseDto. */
export interface Usuario {
  id: string;
  usuario: string;
  correo: string;
  rol: UserRole;
  activo: boolean;
}

/** Igual a CreateUsuarioDto (usuario: maxLength 50, correo: email maxLength 150, password: 8-100, rol: enum). */
export interface CreateUsuarioPayload {
  usuario: string;
  correo: string;
  password: string;
  rol: UserRole;
}

/** Igual a UpdateUsuarioDto = PartialType(CreateUsuarioDto): todos los campos opcionales. */
export interface UpdateUsuarioPayload {
  usuario?: string;
  correo?: string;
  password?: string;
  rol?: UserRole;
}

/** Igual a ListUsuariosQueryDto: solo `usuario` y `correo` son filtrables (coincidencia parcial), no hay filtro por rol/activo ni ordenamiento configurable. */
export interface ListUsuariosParams {
  page: number;
  limit: number;
  usuario?: string;
  correo?: string;
}
