import type { AuthUser } from '../types/auth';

const STORAGE_KEY = 'haku-session';

/**
 * Unico punto de acceso a la persistencia de sesion en toda la app. Nadie
 * mas (paginas, layouts, componentes) debe leer/escribir localStorage
 * directamente para temas de sesion.
 *
 * Implementacion actual: el backend no emite JWT (Feature Freeze), asi
 * que la "sesion" es solo el usuario devuelto por POST /auth/login,
 * guardado en localStorage sin ningun mecanismo de validacion server-side
 * (ver limitacion documentada en FRONTEND_PROGRESS.md, Fase 3). El dia que
 * el backend incorpore JWT, solo esta clase deberia cambiar (por ejemplo,
 * para guardar un token y derivar el usuario de el) - el resto de la app
 * segui consumiendo exclusivamente getCurrentUser()/hasSession().
 */
export const SessionService = {
  saveSession(user: AuthUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  },

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  updateSession(patch: Partial<AuthUser>): void {
    const current = this.getCurrentUser();
    if (!current) return;
    this.saveSession({ ...current, ...patch });
  },

  hasSession(): boolean {
    return this.getCurrentUser() !== null;
  },

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
