import { httpClient } from './http/http-client';
import type { PaginatedResponse } from '../types/api';
import type {
  ReporteEntregasParams,
  ReporteMotorizadoItem,
  ReporteMotorizadosParams,
  ReportePedidoItem,
  ReportePedidosParams,
} from '../types/reporte';

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
};
