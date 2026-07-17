/**
 * Contrato exacto de Backend/src/modules/pedidos y
 * Backend/src/modules/flujo-pedido (revisado directamente en el codigo
 * fuente antes de escribir estos tipos: create-pedido.dto.ts,
 * update-pedido.dto.ts, pedido-response.dto.ts, list-pedidos-query.dto.ts,
 * y los DTOs de flujo-pedido: asignar/reasignar-motorizado,
 * confirmar-recojo/entrega (Fase 22: multipart/form-data, ya no JSON con
 * URLs), iniciar-ruta, registrar-cliente-ausente/rechazo, cancelar-pedido;
 * y el enum `EstadoPedido` de prisma/schema.prisma).
 *
 * `sucursalId`, `clienteId` y `creadoPorId` son inmutables tras la
 * creacion (el backend los excluye explicitamente de UpdatePedidoDto via
 * OmitType) — el formulario de edicion nunca debe permitir cambiarlos.
 *
 * El flujo operativo (Fase 8) vive bajo `/pedidos/:id/<accion>` en el
 * backend (modulo `flujo-pedido`), pero conceptualmente pertenece a
 * Pedidos: sus tipos y su consumo (`PedidosService`) viven aqui, sin crear
 * un "FlujoPedidoService" aparte.
 */

export type EstadoPedido =
  | 'pendiente'
  | 'asignado'
  | 'recogido'
  | 'en_ruta'
  | 'entregado'
  | 'cancelado'
  | 'reprogramado'
  | 'devuelto'
  | 'rechazado'
  | 'cliente_ausente';

/**
 * Estado de pago de un pedido para listados/reportes (Fase 21) — igual al
 * tipo `EstadoPagoPedido` del backend (`common/types/estado-pago-pedido.type.ts`),
 * mas granular que el binario `pagado`/`pendiente` de `ResumenPagoPedido`
 * (modulo Pagos): distingue ademas "sin ningun pago" de "con pago parcial".
 */
export type EstadoPagoPedido = 'sin_pago' | 'pago_parcial' | 'pagado';

/** Igual a PedidoResponseDto. Los montos llegan como string (Decimal serializado por Prisma), nunca number. */
export interface Pedido {
  id: string;
  codigoPedido: string;
  sucursalId: string;
  clienteId: string;
  motorizadoActualId: string | null;
  creadoPorId: string;
  direccionEntrega: string;
  telefonoContacto: string | null;
  descripcionProducto: string | null;
  valorProducto: string | null;
  costoEnvio: string | null;
  estado: EstadoPedido;
  observaciones: string | null;
  creadoEn: string;
  /** Calculado por el backend a partir de los pagos registrados (Fase 21) — nunca recalculado en el frontend. */
  estadoPago: EstadoPagoPedido;
  /** Total del pedido (valorProducto + costoEnvio) y total pagado — igual que ResumenPagoPedido, calculados aqui para no requerir una llamada aparte en tabla/detalle. */
  totalPedido: string;
  totalPagado: string;
  saldoPendiente: string;
}

/** Igual a CreatePedidoDto. */
export interface CreatePedidoPayload {
  sucursalId: number;
  clienteId: number;
  creadoPorId: number;
  direccionEntrega: string;
  telefonoContacto?: string;
  descripcionProducto?: string;
  valorProducto?: number;
  costoEnvio?: number;
  observaciones?: string;
}

/** Igual a UpdatePedidoDto = PartialType(OmitType(CreatePedidoDto, ['sucursalId','clienteId','creadoPorId'])). */
export interface UpdatePedidoPayload {
  direccionEntrega?: string;
  telefonoContacto?: string;
  descripcionProducto?: string;
  valorProducto?: number;
  costoEnvio?: number;
  observaciones?: string;
}

/** Igual a ListPedidosQueryDto. `fechaDesde`/`fechaHasta` no tienen control de UI en esta fase (ver FRONTEND_PROGRESS.md Fase 7). */
export interface ListPedidosParams {
  page: number;
  limit: number;
  codigoPedido?: string;
  clienteId?: number;
  sucursalId?: number;
  estado?: EstadoPedido;
  fechaDesde?: string;
  fechaHasta?: string;
}

/**
 * Estados desde los que el backend permite cancelar un pedido
 * (`ESTADOS_CANCELABLES` en flujo-pedido.service.ts). Los estados
 * terminales (entregado, cancelado, rechazado, devuelto, cliente_ausente,
 * reprogramado) quedan excluidos — reflejado tal cual, no inventado.
 */
export const ESTADOS_CANCELABLES: EstadoPedido[] = ['pendiente', 'asignado', 'recogido', 'en_ruta'];

/** Igual a AsignarMotorizadoDto. */
export interface AsignarMotorizadoPayload {
  motorizadoId: number;
  usuarioId: number;
}

/** Igual a ReasignarMotorizadoDto. */
export interface ReasignarMotorizadoPayload {
  motorizadoAnteriorId: number;
  motorizadoNuevoId: number;
  usuarioId: number;
}

/** Igual a CancelarPedidoDto. */
export interface CancelarPedidoPayload {
  usuarioId: number;
}

/**
 * Igual a ConfirmarRecojoDto (Fase 22/23): la foto se envia como archivo
 * (multipart/form-data, campo "foto"), ya optimizada en el cliente
 * (`utils/optimizar-foto.ts` — redimensionada, convertida a WebP,
 * comprimida) antes de llegar aqui. `PedidosService.confirmarRecojo`
 * arma el `FormData`, nunca el llamador.
 */
export interface ConfirmarRecojoPayload {
  motorizadoId: number;
  foto: File;
}

/** Igual a IniciarRutaDto. */
export interface IniciarRutaPayload {
  motorizadoId: number;
}

/**
 * Igual a ConfirmarEntregaDto (Fase 22/23): las fotos se envian como
 * archivos (multipart/form-data, campo "fotos"), ya optimizadas en el
 * cliente. `fotoPrincipalIndex` (0-based, dentro del arreglo `fotos`)
 * reemplaza al antiguo `esPrincipal` por foto — el backend acepta un
 * unico indice, no un booleano por archivo.
 */
export interface ConfirmarEntregaPayload {
  motorizadoId: number;
  fotos: File[];
  fotoPrincipalIndex?: number;
  observaciones?: string;
}

/** Igual a RegistrarClienteAusenteDto. */
export interface RegistrarClienteAusentePayload {
  motorizadoId: number;
}

/** Igual a RegistrarRechazoDto. */
export interface RegistrarRechazoPayload {
  motorizadoId: number;
}
