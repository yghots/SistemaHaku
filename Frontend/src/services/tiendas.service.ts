import { httpClient } from './http/http-client';
import type { PaginatedResponse } from '../types/api';
import type {
  CreateTiendaPayload,
  ListTiendasParams,
  Tienda,
  UpdateTiendaPayload,
} from '../types/tienda';

/** Unico punto de llamadas HTTP del modulo Tiendas. */
export const TiendasService = {
  async listar(params: ListTiendasParams): Promise<PaginatedResponse<Tienda>> {
    const { data } = await httpClient.get<PaginatedResponse<Tienda>>('/tiendas', { params });
    return data;
  },

  async buscarPorId(id: string): Promise<Tienda> {
    const { data } = await httpClient.get<Tienda>(`/tiendas/${id}`);
    return data;
  },

  async crear(payload: CreateTiendaPayload): Promise<Tienda> {
    const { data } = await httpClient.post<Tienda>('/tiendas', payload);
    return data;
  },

  async actualizar(id: string, payload: UpdateTiendaPayload): Promise<Tienda> {
    const { data } = await httpClient.patch<Tienda>(`/tiendas/${id}`, payload);
    return data;
  },

  async activar(id: string): Promise<Tienda> {
    const { data } = await httpClient.patch<Tienda>(`/tiendas/${id}/activar`);
    return data;
  },

  async desactivar(id: string): Promise<Tienda> {
    const { data } = await httpClient.patch<Tienda>(`/tiendas/${id}/desactivar`);
    return data;
  },

  async eliminar(id: string): Promise<Tienda> {
    const { data } = await httpClient.delete<Tienda>(`/tiendas/${id}`);
    return data;
  },
};
