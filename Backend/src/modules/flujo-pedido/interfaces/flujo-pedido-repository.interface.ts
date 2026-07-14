import { Pedido } from '@prisma/client';

export const FLUJO_PEDIDO_REPOSITORY = Symbol('FLUJO_PEDIDO_REPOSITORY');

export interface FotoEntregaInput {
  urlImagen: string;
  esPrincipal?: boolean;
}

export interface ConfirmarRecojoData {
  pedidoId: bigint;
  motorizadoId: bigint;
  usuarioId: bigint;
  urlImagen: string;
}

export interface IniciarRutaData {
  pedidoId: bigint;
  usuarioId: bigint;
}

export interface ConfirmarEntregaData {
  pedidoId: bigint;
  motorizadoId: bigint;
  usuarioId: bigint;
  fotos: FotoEntregaInput[];
  observaciones?: string;
}

export interface AsignarMotorizadoData {
  pedidoId: bigint;
  motorizadoId: bigint;
  usuarioId: bigint;
}

export interface ReasignarMotorizadoData {
  pedidoId: bigint;
  motorizadoNuevoId: bigint;
  usuarioId: bigint;
}

export interface RegistrarClienteAusenteData {
  pedidoId: bigint;
  usuarioId: bigint;
}

export interface RegistrarRechazoData {
  pedidoId: bigint;
  usuarioId: bigint;
}

export interface CancelarPedidoData {
  pedidoId: bigint;
  usuarioId: bigint;
}

// Cada metodo ejecuta su caso de uso dentro de una unica
// prisma.$transaction: actualiza pedidos (estado, motorizadoActualId y/u
// observaciones segun corresponda), crea la(s) fila(s) de fotos_entrega
// cuando aplica, y crea el evento en historial_pedido. Si cualquier
// escritura falla, toda la operacion se revierte.
export interface IFlujoPedidoRepository {
  confirmarRecojo(data: ConfirmarRecojoData): Promise<Pedido>;
  iniciarRuta(data: IniciarRutaData): Promise<Pedido>;
  confirmarEntrega(data: ConfirmarEntregaData): Promise<Pedido>;
  asignarMotorizado(data: AsignarMotorizadoData): Promise<Pedido>;
  reasignarMotorizado(data: ReasignarMotorizadoData): Promise<Pedido>;
  registrarClienteAusente(data: RegistrarClienteAusenteData): Promise<Pedido>;
  registrarRechazo(data: RegistrarRechazoData): Promise<Pedido>;
  cancelarPedido(data: CancelarPedidoData): Promise<Pedido>;
}
