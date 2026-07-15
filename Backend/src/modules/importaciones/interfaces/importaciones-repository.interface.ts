import {
  EntidadImportacion,
  EstadoFilaImportacion,
  EstadoImportacion,
  FormatoImportacion,
  ImportacionDetalle,
  ImportacionHistorial,
} from '@prisma/client';

export const IMPORTACIONES_REPOSITORY = Symbol('IMPORTACIONES_REPOSITORY');

export type ImportacionHistorialConUsuario = ImportacionHistorial & {
  usuario: { nombres: string; apellidos: string };
};

export type ImportacionHistorialConDetalle = ImportacionHistorialConUsuario & {
  detalles: ImportacionDetalle[];
};

export interface DetalleFilaData {
  fila: number;
  estado: EstadoFilaImportacion;
  motivo: string;
  campo?: string;
  valor?: string;
}

export interface CrearHistorialData {
  entidad: EntidadImportacion;
  archivoNombre: string;
  formato: FormatoImportacion;
  usuarioId: bigint;
  totalEncontrados: number;
  importados: number;
  duplicados: number;
  errores: number;
  tiempoProcesamientoMs: number;
  estado: EstadoImportacion;
  detalles: DetalleFilaData[];
}

export interface BuscarHistorialParams {
  skip: number;
  take: number;
  entidad?: EntidadImportacion;
}

export interface IImportacionesRepository {
  crearHistorial(
    data: CrearHistorialData,
  ): Promise<ImportacionHistorialConUsuario>;
  buscarHistorialPorId(
    id: bigint,
  ): Promise<ImportacionHistorialConDetalle | null>;
  buscarMuchoHistorial(
    params: BuscarHistorialParams,
  ): Promise<{ data: ImportacionHistorialConUsuario[]; total: number }>;
}
