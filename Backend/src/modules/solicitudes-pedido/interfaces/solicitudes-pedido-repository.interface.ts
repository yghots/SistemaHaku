import { EstadoSolicitudPedido, Pedido, SolicitudPedido } from '@prisma/client';

export const SOLICITUDES_PEDIDO_REPOSITORY = Symbol(
  'SOLICITUDES_PEDIDO_REPOSITORY',
);

// estado/clienteId/pedidoId/motivoRechazo/revisadoEn no se exponen aqui: el
// repositorio los controla internamente (estado siempre 'pendiente' al
// crear, el resto se completa unicamente en aprobar/rechazar).
export interface CrearSolicitudData {
  sucursalId: bigint;
  nombreCompleto: string;
  telefono: string;
  direccionEntrega: string;
  descripcionProducto?: string;
  valorProducto?: number;
  costoEnvio?: number;
  observaciones?: string;
}

export interface BuscarSolicitudesParams {
  skip: number;
  take: number;
  estado?: EstadoSolicitudPedido;
  tiendaId?: bigint;
  sucursalId?: bigint;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export interface AprobarSolicitudData {
  solicitudId: bigint;
  /** Se convierte en Pedido.creadoPorId — el mismo criterio ya usado en el
   * resto del proyecto para "quien realiza la accion" sin JWT (ver
   * CancelarPedidoDto.usuarioId). */
  usuarioId: bigint;
}

export interface AprobarSolicitudResultado {
  solicitud: SolicitudPedido;
  pedido: Pedido;
}

export interface RechazarSolicitudData {
  solicitudId: bigint;
  motivoRechazo: string;
}

export interface TiendaConSucursalesPublico {
  id: bigint;
  nombre: string;
  sucursales: { id: bigint; nombre: string }[];
}

export interface ISolicitudesPedidoRepository {
  crear(data: CrearSolicitudData): Promise<SolicitudPedido>;
  buscarPorId(id: bigint): Promise<SolicitudPedido | null>;
  buscarMuchos(
    params: BuscarSolicitudesParams,
  ): Promise<{ data: SolicitudPedido[]; total: number }>;
  /**
   * Ejecuta la aprobacion completa dentro de una unica transaccion Prisma:
   * transicion condicional pendiente -> aprobada (misma tecnica de
   * `updateMany` con precondicion que `FlujoPedidoRepository`, Fase 15),
   * crea o actualiza el Cliente por telefono, crea el Pedido (reutilizando
   * `PedidoCodigoGenerator`, mismo mecanismo de codigo temporal que
   * `PedidosRepository.crear`) y enlaza `clienteId`/`pedidoId` en la
   * solicitud. Si cualquier paso falla, se revierte todo.
   */
  aprobar(data: AprobarSolicitudData): Promise<AprobarSolicitudResultado>;
  rechazar(data: RechazarSolicitudData): Promise<SolicitudPedido>;
  /** Catalogo publico (Tienda + Sucursales activas) para el formulario
   * externo de creacion de solicitudes — sin paginar, solo id/nombre. */
  listarCatalogoPublico(): Promise<TiendaConSucursalesPublico[]>;
}
