import { SessionService } from './session.service';
import { UsuariosService } from './usuarios.service';
import type { Usuario } from '../types/usuario';

export interface ActualizarPerfilPayload {
  usuario: string;
  correo: string;
}

export interface ActualizarPasswordPayload {
  password: string;
}

/**
 * Fachada de "Mi Perfil" (Fase 11): unico punto que la pagina consulta.
 * Reutiliza `UsuariosService` (el CRUD de Usuarios ya soporta consultar,
 * editar y cambiar la contrasena via el mismo `PATCH /usuarios/:id` — no
 * hay endpoints nuevos) y `SessionService`. La pagina nunca importa
 * ninguno de los dos directamente: cualquier sincronizacion de sesion
 * ocurre exclusivamente aqui.
 */
export const ProfileService = {
  /**
   * Trae el usuario autenticado directamente del backend (no solo lo ya
   * guardado en `localStorage`, que puede haber quedado desactualizado)
   * y sincroniza la sesion con esa copia fresca.
   */
  async obtenerPerfil(): Promise<Usuario> {
    const sesion = SessionService.getCurrentUser();
    if (!sesion) {
      throw new Error('No hay una sesion activa.');
    }
    const usuario = await UsuariosService.buscarPorId(sesion.id);
    SessionService.updateSession(usuario);
    return usuario;
  },

  /** Actualiza usuario/correo y sincroniza la sesion con la respuesta del backend. */
  async actualizarPerfil(payload: ActualizarPerfilPayload): Promise<Usuario> {
    const sesion = SessionService.getCurrentUser();
    if (!sesion) {
      throw new Error('No hay una sesion activa.');
    }
    const actualizado = await UsuariosService.actualizar(sesion.id, payload);
    SessionService.updateSession(actualizado);
    return actualizado;
  },

  /**
   * Cambia la contrasena reutilizando el mismo `PATCH /usuarios/:id`
   * (el backend solo la modifica si se envia). No hay dato de sesion que
   * sincronizar: la contrasena nunca se guarda en `SessionService`.
   */
  async actualizarPassword(payload: ActualizarPasswordPayload): Promise<void> {
    const sesion = SessionService.getCurrentUser();
    if (!sesion) {
      throw new Error('No hay una sesion activa.');
    }
    await UsuariosService.actualizar(sesion.id, payload);
  },
};
