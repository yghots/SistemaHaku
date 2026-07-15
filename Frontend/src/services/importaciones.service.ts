import { httpClient } from './http/http-client';
import type { ArchivoDescargable } from '../types/export';
import type {
  EntidadImportacion,
  FormatoImportacion,
  ImportacionHistorialDetalle,
  ImportacionHistorialItem,
  ListarHistorialParams,
  ResultadoImportacion,
} from '../types/importacion';
import type { PaginatedResponse } from '../types/api';
import { filenameFromContentDisposition } from '../utils/download-file';

function toArchivoDescargable(response: {
  data: Blob;
  headers: Record<string, unknown>;
}): ArchivoDescargable {
  return {
    blob: response.data,
    filename: filenameFromContentDisposition(
      response.headers['content-disposition'] as string | undefined,
      'archivo',
    ),
  };
}

/**
 * Unico punto de llamadas HTTP del Centro de Importaciones (Fase 19).
 * `analizar`/`confirmar` envian el archivo como `multipart/form-data`
 * (campo `archivo`); ningun otro servicio del proyecto sube archivos, por
 * eso este es el primero en construir un `FormData` manualmente.
 */
export const ImportacionesService = {
  async descargarPlantilla(
    entidad: EntidadImportacion,
    formato: FormatoImportacion,
  ): Promise<ArchivoDescargable> {
    const response = await httpClient.get<Blob>(`/importaciones/${entidad}/plantilla`, {
      params: { formato },
      responseType: 'blob',
    });
    return toArchivoDescargable(response);
  },

  async analizar(
    entidad: EntidadImportacion,
    formato: FormatoImportacion,
    archivo: File,
  ): Promise<ResultadoImportacion> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    const { data } = await httpClient.post<ResultadoImportacion>(
      `/importaciones/${entidad}/analizar`,
      formData,
      { params: { formato } },
    );
    return data;
  },

  async confirmar(
    entidad: EntidadImportacion,
    formato: FormatoImportacion,
    archivo: File,
    usuarioId: number,
  ): Promise<ResultadoImportacion> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    const { data } = await httpClient.post<ResultadoImportacion>(
      `/importaciones/${entidad}/confirmar`,
      formData,
      { params: { formato, usuarioId } },
    );
    return data;
  },

  async listarHistorial(
    params: ListarHistorialParams,
  ): Promise<PaginatedResponse<ImportacionHistorialItem>> {
    const { data } = await httpClient.get<PaginatedResponse<ImportacionHistorialItem>>(
      '/importaciones/historial',
      { params },
    );
    return data;
  },

  async obtenerHistorialDetalle(id: string): Promise<ImportacionHistorialDetalle> {
    const { data } = await httpClient.get<ImportacionHistorialDetalle>(
      `/importaciones/historial/${id}`,
    );
    return data;
  },

  async descargarReporteErrores(id: string): Promise<ArchivoDescargable> {
    const response = await httpClient.get<Blob>(`/importaciones/historial/${id}/reporte-errores`, {
      responseType: 'blob',
    });
    return toArchivoDescargable(response);
  },
};
