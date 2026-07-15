/**
 * Unica funcion de optimizacion de fotografias del proyecto (Fase 23):
 * redimensiona (lado mayor a 1280px, manteniendo proporcion), convierte a
 * WebP y comprime (~78% de calidad) — usando `browser-image-compression`
 * (Web Worker, no bloquea la interfaz) en vez de una implementacion manual
 * con Canvas. La imagen original nunca se envia ni se conserva: solo la
 * version optimizada que devuelve esta funcion — el backend (Fase 22)
 * ademas ya solo acepta 'image/webp'.
 *
 * La libreria se importa de forma perezosa (dynamic import): solo el
 * Motorizado, al capturar una foto, paga el costo de este bundle — el
 * resto de la aplicacion (Admin, Dashboard, Reportes, etc.) nunca lo carga.
 */

const LADO_MAYOR_MAXIMO_PX = 1280;
const CALIDAD_WEBP = 0.78;

export async function optimizarFoto(archivo: File): Promise<File> {
  const { default: imageCompression } = await import('browser-image-compression');
  return imageCompression(archivo, {
    maxWidthOrHeight: LADO_MAYOR_MAXIMO_PX,
    fileType: 'image/webp',
    initialQuality: CALIDAD_WEBP,
    useWebWorker: true,
  });
}
