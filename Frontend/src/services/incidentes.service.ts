import { httpClient } from './http/http-client';
import type { PaginatedResponse } from '../types/api';
import type { CreateIncidentePayload, Incidente, ListIncidentesParams } from '../types/incidente';

/**
 * Unico punto de llamadas HTTP del modulo Incidentes. CRUD parcial a
 * proposito (igual que el backend): solo `crear`/`buscarPorId`/`listar`,
 * sin `actualizar`/`eliminar` (no existen esos endpoints).
 */
export const IncidentesService = {
  async listar(params: ListIncidentesParams): Promise<PaginatedResponse<Incidente>> {
    const { data } = await httpClient.get<PaginatedResponse<Incidente>>('/incidentes', { params });
    return data;
  },

  async buscarPorId(id: string): Promise<Incidente> {
    const { data } = await httpClient.get<Incidente>(`/incidentes/${id}`);
    return data;
  },

  async crear(payload: CreateIncidentePayload): Promise<Incidente> {
    const { data } = await httpClient.post<Incidente>('/incidentes', payload);
    return data;
  },
};
