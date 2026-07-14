/** Igual a Backend/src/common/exports/export.types.ts (`FormatoExportacion`). */
export type FormatoExportacion = 'xlsx' | 'pdf' | 'csv' | 'json' | 'xml';

export interface FormatoExportacionOption {
  value: FormatoExportacion;
  label: string;
}

/** Un item por cada formato que la infraestructura de exportacion del backend soporta (Fase 18) — no inventar formatos adicionales aqui. */
export const FORMATOS_EXPORTACION_OPTIONS: FormatoExportacionOption[] = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
];

/** Archivo binario ya descargado del backend, listo para `downloadBlob` (src/utils/download-file.ts). */
export interface ArchivoDescargable {
  blob: Blob;
  filename: string;
}
