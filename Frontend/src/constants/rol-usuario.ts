import type { BadgeVariant } from '../components/badge/badge';
import type { UserRole } from '../types/auth';

/**
 * Mapeo de UI para `UserRole`, compartido por el modulo Usuarios (Admin)
 * y Mi Perfil (Fase 11) — evita duplicar el mismo mapa de etiquetas/color
 * en cada pantalla que muestra el rol de un usuario.
 */
export const ROL_USUARIO_LABEL: Record<UserRole, string> = {
  administrador: 'Administrador',
  motorizado: 'Motorizado',
};

export const ROL_USUARIO_BADGE_VARIANT: Record<UserRole, BadgeVariant> = {
  administrador: 'brand',
  motorizado: 'info',
};
