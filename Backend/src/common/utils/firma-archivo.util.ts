/**
 * Verificacion de "magic bytes" (firma binaria real del archivo) — nunca
 * confiar unicamente en el `Content-Type`/mimetype declarado por el
 * cliente, que es trivialmente falsificable en cualquier request que no
 * venga de un navegador real (Fase 29, correccion A8 de la auditoria).
 * Reutilizado por `fotos-entrega` (imagen WEBP) e `importaciones` (archivo
 * xlsx, que es un contenedor ZIP) — unico punto de esta logica.
 */

const FIRMA_RIFF = Buffer.from('RIFF', 'ascii');
const FIRMA_WEBP = Buffer.from('WEBP', 'ascii');
const FIRMA_ZIP = Buffer.from([0x50, 0x4b]); // 'PK' — encabezado de todo archivo ZIP, incluido .xlsx

/** WEBP real: contenedor RIFF (bytes 0-3 `RIFF`) con subtipo WEBP (bytes 8-11 `WEBP`). */
export function esImagenWebp(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(FIRMA_RIFF) &&
    buffer.subarray(8, 12).equals(FIRMA_WEBP)
  );
}

/** Archivo ZIP real (un .xlsx es, en el fondo, un ZIP). */
export function esArchivoZip(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer.subarray(0, 2).equals(FIRMA_ZIP);
}
