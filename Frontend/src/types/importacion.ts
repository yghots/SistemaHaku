/**
 * Contrato exacto de Backend/src/modules/importaciones (Fase 19). Modulo
 * de importacion masiva: analizar (vista previa, sin escribir nada),
 * confirmar (importacion real + historial), historial, reporte de
 * errores y plantillas oficiales.
 */

export type EntidadImportacion = 'cliente' | 'tienda' | 'motorizado';

export const ENTIDADES_IMPORTACION: EntidadImportacion[] = ['cliente', 'tienda', 'motorizado'];

/** Igual a Backend/src/common/imports/import.types.ts (`FormatoImportacion`) — subconjunto de formatos distinto al de exportacion (Fase 18): solo xlsx/json/xml. */
export type FormatoImportacion = 'xlsx' | 'json' | 'xml';

export const FORMATOS_IMPORTACION: FormatoImportacion[] = ['xlsx', 'json', 'xml'];

export interface ResultadoFilaImportacion {
  fila: number;
  estado: 'duplicado' | 'invalido';
  motivo: string;
  campo?: string;
  valor?: string;
}

/** Respuesta compartida por "analizar" (vista previa) y "confirmar" (real) — ver ResultadoImportacionDto (backend). */
export interface ResultadoImportacion {
  historialId?: string;
  totalEncontrados: number;
  importados: number;
  duplicados: number;
  errores: number;
  estado?: 'completado' | 'parcial';
  tiempoProcesamientoMs: number;
  filas: ResultadoFilaImportacion[];
}

export interface ImportacionHistorialItem {
  id: string;
  entidad: EntidadImportacion;
  archivoNombre: string;
  formato: FormatoImportacion;
  usuarioId: string;
  usuarioNombre: string;
  totalEncontrados: number;
  importados: number;
  duplicados: number;
  errores: number;
  tiempoProcesamientoMs: number;
  estado: 'completado' | 'parcial';
  creadoEn: string;
}

export interface ImportacionHistorialDetalle extends ImportacionHistorialItem {
  filas: ResultadoFilaImportacion[];
}

export interface ListarHistorialParams {
  page: number;
  limit: number;
  entidad?: EntidadImportacion;
}
