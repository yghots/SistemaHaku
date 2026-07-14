import { SessionService } from '../services/session.service';
import type { RouteRenderer } from './router';

/**
 * Envuelve un RouteRenderer para exigir sesion activa antes de renderizar.
 * Depende unicamente de SessionService (regla del proyecto). Si no hay
 * sesion (ej. se borro localStorage manualmente durante la navegacion
 * dentro de la SPA), redirige con una navegacion dura a /login en vez de
 * renderizar la pagina protegida.
 */
export function withAuth(render: RouteRenderer): RouteRenderer {
  return (container, params) => {
    if (!SessionService.hasSession()) {
      window.location.href = '/login';
      return undefined;
    }
    return render(container, params);
  };
}
