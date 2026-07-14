/**
 * Contrato exacto de auth del backend (Backend/src/modules/auth,
 * Backend/API_OVERVIEW.md). No agregar propiedades que el backend no
 * devuelva: no hay token, no hay expiresIn, no hay refreshToken - el
 * backend esta en Feature Freeze sin JWT.
 */

export type UserRole = 'administrador' | 'motorizado';

/** Igual a UsuarioResponseDto (backend). */
export interface AuthUser {
  id: string;
  usuario: string;
  correo: string;
  rol: UserRole;
  activo: boolean;
}

/** Igual a AuthResponseDto (backend): POST /auth/login y POST /auth/register devuelven esta forma. */
export interface LoginResponse {
  usuario: AuthUser;
}
