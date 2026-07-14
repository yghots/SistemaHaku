/**
 * Placeholder deliberado: el backend esta en Feature Freeze SIN JWT
 * implementado todavia (ver Backend/DEVELOPMENT_PROGRESS.md, Fase 12).
 * Esta funcion es el UNICO punto que el interceptor de axios consulta para
 * el header Authorization. Cuando exista JWT, reemplazar esta funcion por
 * la lectura del store/servicio de sesion real - ningun otro archivo
 * deberia necesitar cambios.
 */
export function getAccessToken(): string | null {
  return null;
}
