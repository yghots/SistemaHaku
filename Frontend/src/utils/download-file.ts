/** Dispara la descarga de un Blob ya recibido del backend con el nombre de archivo indicado. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Extrae el nombre de archivo del header `Content-Disposition` que arma el
 * backend (`attachment; filename="..."`, ver
 * Backend/src/common/exports/export-filename.util.ts) — el frontend nunca
 * inventa su propio nombre de archivo, solo lo lee de la respuesta.
 */
export function filenameFromContentDisposition(
  contentDisposition: string | undefined,
  fallback: string,
): string {
  if (!contentDisposition) return fallback;
  const match = /filename="([^"]+)"/.exec(contentDisposition);
  return match?.[1] ?? fallback;
}
