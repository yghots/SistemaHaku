import { httpClient } from './http/http-client';
import type { PaginatedResponse } from '../types/api';
import type {
  CreateUsuarioPayload,
  ListUsuariosParams,
  UpdateUsuarioPayload,
  Usuario,
} from '../types/usuario';

/**
 * Unico punto de llamadas HTTP del modulo Usuarios. Ninguna pagina debe
 * usar `httpClient`/axios directamente.
 */
export const UsuariosService = {
  async listar(params: ListUsuariosParams): Promise<PaginatedResponse<Usuario>> {
    const { data } = await httpClient.get<PaginatedResponse<Usuario>>('/usuarios', { params });
    return data;
  },

  async buscarPorId(id: string): Promise<Usuario> {
    const { data } = await httpClient.get<Usuario>(`/usuarios/${id}`);
    return data;
  },

  async crear(payload: CreateUsuarioPayload): Promise<Usuario> {
    const { data } = await httpClient.post<Usuario>('/usuarios', payload);
    return data;
  },

  async actualizar(id: string, payload: UpdateUsuarioPayload): Promise<Usuario> {
    const { data } = await httpClient.patch<Usuario>(`/usuarios/${id}`, payload);
    return data;
  },

  async activar(id: string): Promise<Usuario> {
    const { data } = await httpClient.patch<Usuario>(`/usuarios/${id}/activar`);
    return data;
  },

  async desactivar(id: string): Promise<Usuario> {
    const { data } = await httpClient.patch<Usuario>(`/usuarios/${id}/desactivar`);
    return data;
  },

  async eliminar(id: string): Promise<Usuario> {
    const { data } = await httpClient.delete<Usuario>(`/usuarios/${id}`);
    return data;
  },
};
