/**
 * Contrato exacto de Backend/src/modules/solicitudes-pedido (revisado
 * directamente en solicitud-pedido-response.dto.ts,
 * list-solicitudes-query.dto.ts, aprobar-solicitud.dto.ts,
 * rechazar-solicitud.dto.ts, y el enum `EstadoSolicitudPedido` de
 * prisma/schema.prisma). Solo el panel administrativo: los DTOs/endpoints
 * publicos (`/public/tiendas`, `/public/solicitudes`) no se consumen desde
 * este modulo (pertenecen a una fase distinta, ver el propio backend).
 */

export type EstadoSolicitudPedido = 'pendiente' | 'aprobada' | 'rechazada';

/** Igual a SolicitudPedidoResponseDto. Los montos llegan como string (Decimal serializado por Prisma), nunca number. */
export interface SolicitudPedido {
  id: string;
  sucursalId: string;
  nombreCompleto: string;
  telefono: string;
  direccionEntrega: string;
  descripcionProducto: string | null;
  valorProducto: string | null;
  costoEnvio: string | null;
  observaciones: string | null;
  estado: EstadoSolicitudPedido;
  motivoRechazo: string | null;
  clienteId: string | null;
  pedidoId: string | null;
  creadoEn: string;
  revisadoEn: string | null;
}

/** Igual a ListSolicitudesQueryDto. `tiendaId` filtra a traves de la sucursal (el backend lo resuelve con un join). */
export interface ListSolicitudesParams {
  page: number;
  limit: number;
  estado?: EstadoSolicitudPedido;
  tiendaId?: number;
  sucursalId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

/** Igual a AprobarSolicitudDto. `usuarioId` es el administrador que aprueba (se completa desde SessionService, nunca se le pide al usuario). */
export interface AprobarSolicitudPayload {
  usuarioId: number;
}

/** Igual a RechazarSolicitudDto. */
export interface RechazarSolicitudPayload {
  motivoRechazo: string;
}
