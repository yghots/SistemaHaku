import { httpClient } from './http/http-client';
import type { PaginatedResponse } from '../types/api';
import type {
  CreatePerfilMotorizadoPayload,
  ListPerfilesMotorizadosParams,
  PerfilMotorizado,
  UpdatePerfilMotorizadoPayload,
} from '../types/perfil-motorizado';

/**
 * Unico punto de llamadas HTTP del modulo Motorizados. Consume
 * `/perfiles-motorizados` (nombre real del recurso en el backend): el
 * perfil operativo (placa/estado) de un usuario con rol motorizado.
 */
export const MotorizadosService = {
  async listar(
    params: ListPerfilesMotorizadosParams,
  ): Promise<PaginatedResponse<PerfilMotorizado>> {
    const { data } = await httpClient.get<PaginatedResponse<PerfilMotorizado>>(
      '/perfiles-motorizados',
      { params },
    );
    return data;
  },

  async buscarPorId(id: string): Promise<PerfilMotorizado> {
    const { data } = await httpClient.get<PerfilMotorizado>(`/perfiles-motorizados/${id}`);
    return data;
  },

  /**
   * Resuelve el perfil operativo del usuario con sesion activa (rol
   * motorizado). Usado por el panel del Motorizado para conocer su propio
   * `motorizadoId` (distinto del `usuarioId` de sesion) antes de poder
   * ver sus pedidos o ejecutar cualquier accion del flujo operativo.
   * Devuelve `null` si el usuario todavia no tiene un perfil creado por
   * un administrador (caso real, no un error).
   */
  async buscarPorUsuarioId(usuarioId: string): Promise<PerfilMotorizado | null> {
    const response = await this.listar({
      page: 1,
      limit: 1,
      usuarioId: Number(usuarioId),
    });
    return response.data[0] ?? null;
  },

  async crear(payload: CreatePerfilMotorizadoPayload): Promise<PerfilMotorizado> {
    const { data } = await httpClient.post<PerfilMotorizado>('/perfiles-motorizados', payload);
    return data;
  },

  async actualizar(id: string, payload: UpdatePerfilMotorizadoPayload): Promise<PerfilMotorizado> {
    const { data } = await httpClient.patch<PerfilMotorizado>(
      `/perfiles-motorizados/${id}`,
      payload,
    );
    return data;
  },

  async eliminar(id: string): Promise<PerfilMotorizado> {
    const { data } = await httpClient.delete<PerfilMotorizado>(`/perfiles-motorizados/${id}`);
    return data;
  },
};
