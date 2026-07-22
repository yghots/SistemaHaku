import { httpClient } from './http/http-client';
import type { PaginatedResponse } from '../types/api';
import type {
  AprobarSolicitudPayload,
  ListSolicitudesParams,
  RechazarSolicitudPayload,
  SolicitudPedido,
} from '../types/solicitud-pedido';

/**
 * Unico punto de llamadas HTTP del modulo Solicitudes (panel
 * administrativo). Consume unicamente `/solicitudes` — nunca los endpoints
 * publicos (`/public/tiendas`, `/public/solicitudes`), que pertenecen a
 * otra fase (formulario externo, sin sesion).
 */
export const SolicitudesService = {
  async listar(params: ListSolicitudesParams): Promise<PaginatedResponse<SolicitudPedido>> {
    const { data } = await httpClient.get<PaginatedResponse<SolicitudPedido>>('/solicitudes', {
      params,
    });
    return data;
  },

  async buscarPorId(id: string): Promise<SolicitudPedido> {
    const { data } = await httpClient.get<SolicitudPedido>(`/solicitudes/${id}`);
    return data;
  },

  async aprobar(id: string, payload: AprobarSolicitudPayload): Promise<SolicitudPedido> {
    const { data } = await httpClient.post<SolicitudPedido>(
      `/solicitudes/${id}/aprobar`,
      payload,
    );
    return data;
  },

  async rechazar(id: string, payload: RechazarSolicitudPayload): Promise<SolicitudPedido> {
    const { data } = await httpClient.post<SolicitudPedido>(
      `/solicitudes/${id}/rechazar`,
      payload,
    );
    return data;
  },
};
