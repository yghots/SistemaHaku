import { httpClient } from './http/http-client';
import type { PaginatedResponse } from '../types/api';
import type { FotoEntrega } from '../types/foto-entrega';
import type { HistorialPedido } from '../types/historial-pedido';
import type {
  AsignarMotorizadoPayload,
  CancelarPedidoPayload,
  ConfirmarEntregaPayload,
  ConfirmarRecojoPayload,
  CreatePedidoPayload,
  IniciarRutaPayload,
  ListPedidosParams,
  Pedido,
  ReasignarMotorizadoPayload,
  RegistrarClienteAusentePayload,
  RegistrarRechazoPayload,
  UpdatePedidoPayload,
} from '../types/pedido';

interface ListSubrecursoParams {
  page: number;
  limit: number;
}

/**
 * Unico punto de llamadas HTTP del modulo Pedidos: CRUD administrativo
 * (Fase 7) y flujo operativo (Fase 8). El flujo operativo vive bajo
 * `/pedidos/:id/<accion>` en el backend (modulo `flujo-pedido`), pero
 * conceptualmente pertenece a Pedidos — se extiende este servicio en vez
 * de crear uno nuevo. Lo mismo para historial y fotos (`/pedidos/:id/historial`,
 * `/pedidos/:id/fotos`): son sub-recursos de solo lectura de un Pedido.
 */
export const PedidosService = {
  async listar(params: ListPedidosParams): Promise<PaginatedResponse<Pedido>> {
    const { data } = await httpClient.get<PaginatedResponse<Pedido>>('/pedidos', { params });
    return data;
  },

  async buscarPorId(id: string): Promise<Pedido> {
    const { data } = await httpClient.get<Pedido>(`/pedidos/${id}`);
    return data;
  },

  async crear(payload: CreatePedidoPayload): Promise<Pedido> {
    const { data } = await httpClient.post<Pedido>('/pedidos', payload);
    return data;
  },

  async actualizar(id: string, payload: UpdatePedidoPayload): Promise<Pedido> {
    const { data } = await httpClient.patch<Pedido>(`/pedidos/${id}`, payload);
    return data;
  },

  async eliminar(id: string): Promise<Pedido> {
    const { data } = await httpClient.delete<Pedido>(`/pedidos/${id}`);
    return data;
  },

  // ---- Flujo operativo (Fase 8, CU04-CU12) ----

  async asignarMotorizado(id: string, payload: AsignarMotorizadoPayload): Promise<Pedido> {
    const { data } = await httpClient.post<Pedido>(`/pedidos/${id}/asignar-motorizado`, payload);
    return data;
  },

  async reasignarMotorizado(id: string, payload: ReasignarMotorizadoPayload): Promise<Pedido> {
    const { data } = await httpClient.post<Pedido>(`/pedidos/${id}/reasignar-motorizado`, payload);
    return data;
  },

  async cancelarPedido(id: string, payload: CancelarPedidoPayload): Promise<Pedido> {
    const { data } = await httpClient.post<Pedido>(`/pedidos/${id}/cancelar`, payload);
    return data;
  },

  async confirmarRecojo(id: string, payload: ConfirmarRecojoPayload): Promise<Pedido> {
    const { data } = await httpClient.post<Pedido>(`/pedidos/${id}/confirmar-recojo`, payload);
    return data;
  },

  async iniciarRuta(id: string, payload: IniciarRutaPayload): Promise<Pedido> {
    const { data } = await httpClient.post<Pedido>(`/pedidos/${id}/iniciar-ruta`, payload);
    return data;
  },

  async confirmarEntrega(id: string, payload: ConfirmarEntregaPayload): Promise<Pedido> {
    const { data } = await httpClient.post<Pedido>(`/pedidos/${id}/confirmar-entrega`, payload);
    return data;
  },

  async registrarClienteAusente(
    id: string,
    payload: RegistrarClienteAusentePayload,
  ): Promise<Pedido> {
    const { data } = await httpClient.post<Pedido>(`/pedidos/${id}/cliente-ausente`, payload);
    return data;
  },

  async registrarRechazo(id: string, payload: RegistrarRechazoPayload): Promise<Pedido> {
    const { data } = await httpClient.post<Pedido>(`/pedidos/${id}/rechazo`, payload);
    return data;
  },

  // ---- Sub-recursos de solo lectura ----

  async obtenerHistorial(
    id: string,
    params: ListSubrecursoParams,
  ): Promise<PaginatedResponse<HistorialPedido>> {
    const { data } = await httpClient.get<PaginatedResponse<HistorialPedido>>(
      `/pedidos/${id}/historial`,
      { params },
    );
    return data;
  },

  async obtenerFotos(
    id: string,
    params: ListSubrecursoParams,
  ): Promise<PaginatedResponse<FotoEntrega>> {
    const { data } = await httpClient.get<PaginatedResponse<FotoEntrega>>(`/pedidos/${id}/fotos`, {
      params,
    });
    return data;
  },
};
