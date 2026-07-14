import { httpClient } from './http/http-client';
import type { PaginatedResponse } from '../types/api';
import type {
  Cliente,
  CreateClientePayload,
  ListClientesParams,
  UpdateClientePayload,
} from '../types/cliente';

/**
 * Unico punto de llamadas HTTP del modulo Clientes. Sin activar/desactivar:
 * el backend no expone esos endpoints para Cliente (no tiene campo `activo`).
 */
export const ClientesService = {
  async listar(params: ListClientesParams): Promise<PaginatedResponse<Cliente>> {
    const { data } = await httpClient.get<PaginatedResponse<Cliente>>('/clientes', { params });
    return data;
  },

  async buscarPorId(id: string): Promise<Cliente> {
    const { data } = await httpClient.get<Cliente>(`/clientes/${id}`);
    return data;
  },

  async crear(payload: CreateClientePayload): Promise<Cliente> {
    const { data } = await httpClient.post<Cliente>('/clientes', payload);
    return data;
  },

  async actualizar(id: string, payload: UpdateClientePayload): Promise<Cliente> {
    const { data } = await httpClient.patch<Cliente>(`/clientes/${id}`, payload);
    return data;
  },

  async eliminar(id: string): Promise<Cliente> {
    const { data } = await httpClient.delete<Cliente>(`/clientes/${id}`);
    return data;
  },
};
