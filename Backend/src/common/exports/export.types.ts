/**
 * Contrato unico de toda la infraestructura de exportacion (Fase 18).
 * Ningun exportador conoce el tipo de reporte que produjo estos datos —
 * solo reciben esta forma generica. Reutilizable por cualquier modulo
 * futuro que necesite exportar un listado, no solo Reportes.
 */

export type FormatoExportacion = 'xlsx' | 'pdf' | 'csv' | 'json' | 'xml';

export const FORMATOS_EXPORTACION: FormatoExportacion[] = [
  'xlsx',
  'pdf',
  'csv',
  'json',
  'xml',
];

/** Una columna del reporte: `clave` es el nombre de campo de cada fila de `filas`; `encabezado` es la etiqueta legible mostrada en Excel/PDF/CSV. */
export interface ExportColumna {
  clave: string;
  encabezado: string;
}

/**
 * Lo unico que recibe cualquier exportador. `filas` ya viene con valores
 * listos para mostrarse (fechas formateadas, enums como string, etc.) —
 * ningun exportador aplica logica de negocio ni conoce el dominio del
 * reporte.
 */
export interface ExportSolicitud {
  /** Nombre del reporte (ej. "Reporte de Pedidos"). */
  titulo: string;
  columnas: ExportColumna[];
  filas: Record<string, string | number>[];
  /** Filtros realmente aplicados por quien generó el reporte (vacío si no se aplicó ninguno). */
  filtros: Record<string, string>;
  /** Nombre de la persona que generó la exportación (no hay JWT: se recibe explícito, igual que el resto del sistema). */
  generadoPor: string;
  generadoEn: Date;
}

export interface ExportArchivo {
  buffer: Buffer;
  nombreArchivo: string;
  mimeType: string;
}

/** Contrato que implementa cada uno de los 5 exportadores concretos. */
export interface IExportador {
  exportar(solicitud: ExportSolicitud): Promise<ExportArchivo> | ExportArchivo;
}
