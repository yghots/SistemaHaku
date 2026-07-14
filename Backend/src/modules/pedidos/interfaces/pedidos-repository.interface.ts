import { EstadoPedido, Pedido } from '@prisma/client';

export const PEDIDOS_REPOSITORY = Symbol('PEDIDOS_REPOSITORY');

// codigoPedido y estado no se exponen aqui: el repositorio los controla
// internamente (estado siempre 'pendiente', codigoPedido siempre derivado
// del id autogenerado). motorizadoActualId tampoco: no se asigna al crear
// (ver DEVELOPMENT_PROGRESS.md, Fase 7).
export interface CrearPedidoData {
  sucursalId: bigint;
  clienteId: bigint;
  creadoPorId: bigint;
  direccionEntrega: string;
  telefonoContacto?: string;
  descripcionProducto?: string;
  valorProducto?: number;
  costoEnvio?: number;
  observaciones?: string;
}

export interface ActualizarPedidoData {
  direccionEntrega?: string;
  telefonoContacto?: string;
  descripcionProducto?: string;
  valorProducto?: number;
  costoEnvio?: number;
  observaciones?: string;
}

export interface BuscarPedidosParams {
  skip: number;
  take: number;
  codigoPedido?: string;
  clienteId?: bigint;
  sucursalId?: bigint;
  estado?: EstadoPedido;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export interface IPedidosRepository {
  crear(data: CrearPedidoData): Promise<Pedido>;
  buscarPorId(id: bigint): Promise<Pedido | null>;
  buscarMuchos(
    params: BuscarPedidosParams,
  ): Promise<{ data: Pedido[]; total: number }>;
  actualizar(id: bigint, data: ActualizarPedidoData): Promise<Pedido>;
  eliminar(id: bigint): Promise<Pedido>;
}
