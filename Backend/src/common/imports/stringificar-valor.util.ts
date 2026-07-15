/**
 * Convierte un valor de origen desconocido (json/xml pueden traer
 * cualquier tipo) a texto plano de forma segura — nunca delega en el
 * `toString()` por defecto de un objeto (que produciria `[object Object]`).
 */
export function stringificarValor(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean')
    return String(valor);
  try {
    return JSON.stringify(valor);
  } catch {
    return '';
  }
}
