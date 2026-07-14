import { SessionService } from '../services/session.service';

/**
 * Cierra la sesion y redirige a Login. Unico punto de logout de toda la
 * app (usado por AdminLayout y RiderLayout) - evita duplicar la logica de
 * "limpiar sesion + navegar" en cada layout. Navegacion dura a proposito:
 * reinicia todo el estado en memoria de la SPA (router, listeners, etc.)
 * de forma limpia.
 */
export function logout(): void {
  SessionService.clearSession();
  window.location.href = '/login';
}
