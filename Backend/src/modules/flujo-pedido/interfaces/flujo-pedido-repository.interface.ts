import { EstadoPedido, Pedido } from '@prisma/client';

export const FLUJO_PEDIDO_REPOSITORY = Symbol('FLUJO_PEDIDO_REPOSITORY');

// CU04 (Fase 10): estados activos desde los que se permite cancelar un
// pedido. Decision aprobada explicitamente por el cliente (ver
// DEVELOPMENT_PROGRESS.md, Fase 10): se puede cancelar en cualquier
// momento anterior a la entrega. Los estados terminales (entregado,
// cancelado, rechazado, devuelto, cliente_ausente, reprogramado) quedan
// excluidos. Unica fuente de verdad (Fase 15): tanto el service (mensaje
// de error legible) como el repository (condicion atomica del update)
// importan esta misma constante en vez de mantener dos copias.
export const ESTADOS_CANCELABLES: EstadoPedido[] = [
  EstadoPedido.pendiente,
  EstadoPedido.asignado,
  EstadoPedido.recogido,
  EstadoPedido.en_ruta,
];

// Fase 29 (correccion A2 de la auditoria): estados terminales desde los que
// ya no tiene sentido reasignar un motorizado (el pedido salio por completo
// del flujo activo). Antes de esta correccion, `reasignarMotorizado` no
// validaba el estado del pedido en absoluto (hallazgo A1 original de
// AUDIT_REPORT.md) — permitia reasignar incluso sobre un pedido ya
// entregado/cancelado/rechazado. Unica fuente de verdad, mismo patron que
// `ESTADOS_CANCELABLES`: tanto el service (mensaje de error) como el
// repository (condicion atomica del update) importan esta misma constante.
export const ESTADOS_NO_REASIGNABLES: EstadoPedido[] = [
  EstadoPedido.entregado,
  EstadoPedido.cancelado,
  EstadoPedido.rechazado,
];

// Fase 22: las fotos se reciben como binario (multipart/form-data) y se
// almacenan directamente en MySQL — `imagen`/`mimeType` reemplazan por
// completo al antiguo `urlImagen`. `Uint8Array` (no `Buffer`) porque es
// exactamente el tipo `Bytes` que expone Prisma para un campo LongBlob.
export interface FotoEntregaInput {
  imagen: Uint8Array<ArrayBuffer>;
  mimeType: string;
  esPrincipal?: boolean;
}

export interface ConfirmarRecojoData {
  pedidoId: bigint;
  motorizadoId: bigint;
  usuarioId: bigint;
  imagen: Uint8Array<ArrayBuffer>;
  mimeType: string;
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
  /** Motorizado esperado como asignado actual del pedido (Fase 15): la condicion del update atomico se filtra tambien por este campo, para que dos reasignaciones concurrentes nunca puedan pisarse silenciosamente. */
  motorizadoAnteriorId: bigint;
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
