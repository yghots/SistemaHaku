import { httpClient } from './http/http-client';
import type { PaginatedResponse } from '../types/api';
import type { ArchivoDescargable } from '../types/export';
import type {
  ReporteEntregasExportParams,
  ReporteEntregasParams,
  ReporteMotorizadoItem,
  ReporteMotorizadosExportParams,
  ReporteMotorizadosParams,
  ReportePedidoItem,
  ReportePedidosExportParams,
  ReportePedidosParams,
} from '../types/reporte';
import { filenameFromContentDisposition } from '../utils/download-file';

/** Lee el Blob + nombre de archivo de una respuesta de descarga — el nombre siempre lo decide el backend (Content-Disposition), nunca se inventa aqui. */
function toArchivoDescargable(response: {
  data: Blob;
  headers: Record<string, unknown>;
}): ArchivoDescargable {
  return {
    blob: response.data,
    filename: filenameFromContentDisposition(
      response.headers['content-disposition'] as string | undefined,
      'reporte',
    ),
  };
}

/**
 * Unico punto de llamadas HTTP del modulo Reportes. Solo consulta (GET):
 * el backend no expone crear/actualizar/eliminar para este modulo.
 */
export const ReportesService = {
  async reportePedidos(
    params: ReportePedidosParams,
  ): Promise<PaginatedResponse<ReportePedidoItem>> {
    const { data } = await httpClient.get<PaginatedResponse<ReportePedidoItem>>(
      '/reportes/pedidos',
      { params },
    );
    return data;
  },

  async reporteEntregas(
    params: ReporteEntregasParams,
  ): Promise<PaginatedResponse<ReportePedidoItem>> {
    const { data } = await httpClient.get<PaginatedResponse<ReportePedidoItem>>(
      '/reportes/entregas',
      { params },
    );
    return data;
  },

  async reporteMotorizados(
    params: ReporteMotorizadosParams,
  ): Promise<PaginatedResponse<ReporteMotorizadoItem>> {
    const { data } = await httpClient.get<PaginatedResponse<ReporteMotorizadoItem>>(
      '/reportes/motorizados',
      { params },
    );
    return data;
  },

  /**
   * Exporta el Reporte de Pedidos (Fase 18): mismos filtros de
   * `reportePedidos`, sin paginar. Solo pide el archivo y lo devuelve —
   * nunca lo genera ni lo descarga (eso es responsabilidad de quien llame,
   * via `downloadBlob`).
   */
  async exportarReportePedidos(params: ReportePedidosExportParams): Promise<ArchivoDescargable> {
    const response = await httpClient.get<Blob>('/reportes/pedidos/export', {
      params,
      responseType: 'blob',
    });
    return toArchivoDescargable(response);
  },

  async exportarReporteEntregas(params: ReporteEntregasExportParams): Promise<ArchivoDescargable> {
    const response = await httpClient.get<Blob>('/reportes/entregas/export', {
      params,
      responseType: 'blob',
    });
    return toArchivoDescargable(response);
  },

  async exportarReporteMotorizados(
    params: ReporteMotorizadosExportParams,
  ): Promise<ArchivoDescargable> {
    const response = await httpClient.get<Blob>('/reportes/motorizados/export', {
      params,
      responseType: 'blob',
    });
    return toArchivoDescargable(response);
  },
};
