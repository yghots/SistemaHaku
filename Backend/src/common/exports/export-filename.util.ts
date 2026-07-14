const INICIO_DIACRITICOS = 0x0300;
const FIN_DIACRITICOS = 0x036f;

/** Convierte el titulo de un reporte a un slug seguro para nombre de archivo (sin tildes, minusculas, guiones). */
function slugificar(texto: string): string {
  const sinTildes = Array.from(texto.normalize('NFD'))
    .filter((char) => {
      const codigo = char.codePointAt(0) ?? 0;
      return codigo < INICIO_DIACRITICOS || codigo > FIN_DIACRITICOS;
    })
    .join('');
  return sinTildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

/** `YYYYMMDD-HHmmss` en hora local del servidor — suficiente para un nombre de archivo unico, sin depender de ninguna libreria de fechas (el backend no usa Day.js, esa es una regla exclusiva del frontend). */
function timestamp(fecha: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return (
    `${fecha.getFullYear()}${pad(fecha.getMonth() + 1)}${pad(fecha.getDate())}` +
    `-${pad(fecha.getHours())}${pad(fecha.getMinutes())}${pad(fecha.getSeconds())}`
  );
}

/**
 * Unica funcion que arma el nombre de archivo de cualquier exportacion
 * (Fase 18) — los 5 exportadores la reutilizan, ninguno construye su
 * propio nombre por separado.
 */
export function construirNombreArchivo(
  titulo: string,
  extension: string,
  generadoEn: Date,
): string {
  return `${slugificar(titulo)}_${timestamp(generadoEn)}.${extension}`;
}
