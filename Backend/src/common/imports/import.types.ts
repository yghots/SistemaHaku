export type FormatoImportacion = 'xlsx' | 'json' | 'xml';

export const FORMATOS_IMPORTACION: FormatoImportacion[] = [
  'xlsx',
  'json',
  'xml',
];

/**
 * Una fila cruda leida del archivo, siempre como texto plano —
 * normalizada por el lector correspondiente antes de llegar a cualquier
 * validador, sin importar si el archivo de origen era xlsx, json o xml.
 * Es lo que permite que los 3 formatos compartan exactamente la misma
 * logica de validacion (ningun validador conoce el formato de origen).
 */
export type FilaCruda = Record<string, string>;

export interface ILectorImportacion {
  leer(buffer: Buffer): FilaCruda[] | Promise<FilaCruda[]>;
}
