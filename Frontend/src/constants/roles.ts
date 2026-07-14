import type { UserRole } from '../types/auth';

/** Ruta por defecto a la que se redirige a cada rol tras iniciar sesion. */
export const DEFAULT_PATH_BY_ROLE: Record<UserRole, string> = {
  administrador: '/admin/dashboard',
  motorizado: '/rider/dashboard',
};
