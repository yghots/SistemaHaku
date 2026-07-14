export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'haku-theme';
const listeners = new Set<(theme: Theme) => void>();

function readStoredTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(STORAGE_KEY, theme);
  for (const listener of listeners) listener(theme);
}

/** Tema activo actual, leido directamente del DOM (fuente de verdad = clase `dark` en <html>). */
export function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Debe llamarse una sola vez, lo antes posible en main.ts (antes de
 * renderizar), para evitar un parpadeo del tema incorrecto. Por defecto
 * el tema es 'light' (regla del proyecto), salvo que el usuario ya haya
 * elegido 'dark' antes (persistido en localStorage).
 */
export function initTheme(): void {
  applyTheme(readStoredTheme() ?? 'light');
}

export function setTheme(theme: Theme): void {
  applyTheme(theme);
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

/** Se notifica a `listener` cada vez que el tema cambia (ej. para actualizar el icono del boton de tema). Devuelve una funcion para dejar de escuchar. */
export function onThemeChange(listener: (theme: Theme) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
