export type Theme = 'light' | 'dark' | 'midnight';

const THEMES: Theme[] = ['light', 'dark', 'midnight'];
const STORAGE_KEY = 'haku-theme';
const listeners = new Set<(theme: Theme) => void>();

function readStoredTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY);
  return THEMES.includes(value as Theme) ? (value as Theme) : null;
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.classList.toggle('midnight', theme === 'midnight');
  localStorage.setItem(STORAGE_KEY, theme);
  for (const listener of listeners) listener(theme);
}

/** Tema activo actual, leido directamente del DOM (fuente de verdad = clases `dark`/`midnight` en <html>, mutuamente excluyentes). */
export function getTheme(): Theme {
  if (document.documentElement.classList.contains('dark')) return 'dark';
  if (document.documentElement.classList.contains('midnight')) return 'midnight';
  return 'light';
}

/**
 * Debe llamarse una sola vez, lo antes posible en main.ts (antes de
 * renderizar), para evitar un parpadeo del tema incorrecto. Por defecto
 * el tema es 'light' (regla del proyecto), salvo que el usuario ya haya
 * elegido 'dark'/'midnight' antes (persistido en localStorage).
 */
export function initTheme(): void {
  applyTheme(readStoredTheme() ?? 'light');
}

export function setTheme(theme: Theme): void {
  applyTheme(theme);
}

/** Cicla Light → Dark → Midnight → Light (Fase 21: agrega el tercer tema al mismo boton de un solo click, sin cambiar la interaccion existente). */
export function toggleTheme(): Theme {
  const currentIndex = THEMES.indexOf(getTheme());
  const next = THEMES[(currentIndex + 1) % THEMES.length]!;
  applyTheme(next);
  return next;
}

/** Se notifica a `listener` cada vez que el tema cambia (ej. para actualizar el icono del boton de tema). Devuelve una funcion para dejar de escuchar. */
export function onThemeChange(listener: (theme: Theme) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
