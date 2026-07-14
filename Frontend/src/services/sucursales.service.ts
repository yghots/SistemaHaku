import { httpClient } from './http/http-client';
import type { PaginatedResponse } from '../types/api';
import type {
  CreateSucursalPayload,
  ListSucursalesParams,
  Sucursal,
  UpdateSucursalPayload,
} from '../types/sucursal';

/**
 * Unico punto de llamadas HTTP del modulo Sucursales. Sin activar/desactivar:
 * el backend no expone esos endpoints para Sucursales (no tiene campo `activo`).
 */
export const SucursalesService = {
  async listar(params: ListSucursalesParams): Promise<PaginatedResponse<Sucursal>> {
    const { data } = await httpClient.get<PaginatedResponse<Sucursal>>('/sucursales', { params });
    return data;
  },

  async buscarPorId(id: string): Promise<Sucursal> {
    const { data } = await httpClient.get<Sucursal>(`/sucursales/${id}`);
    return data;
  },

  async crear(payload: CreateSucursalPayload): Promise<Sucursal> {
    const { data } = await httpClient.post<Sucursal>('/sucursales', payload);
    return data;
  },

  async actualizar(id: string, payload: UpdateSucursalPayload): Promise<Sucursal> {
    const { data } = await httpClient.patch<Sucursal>(`/sucursales/${id}`, payload);
    return data;
  },

  async eliminar(id: string): Promise<Sucursal> {
    const { data } = await httpClient.delete<Sucursal>(`/sucursales/${id}`);
    return data;
  },
};
