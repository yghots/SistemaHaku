import { MetodoPago, Pago } from '@prisma/client';

export const PAGOS_REPOSITORY = Symbol('PAGOS_REPOSITORY');

export interface CrearPagoData {
  pedidoId: bigint;
  metodoPago: MetodoPago;
  monto: number;
  montoRecibido?: number;
  vuelto?: number;
  observacion?: string;
  creadoPorId: bigint;
}

export interface BuscarPagosPorPedidoParams {
  pedidoId: bigint;
  skip: number;
  take: number;
}

// Solo lectura salvo `crear`: un pago es un registro historico inmutable
// (Fase 20) — no existe metodo de actualizacion ni eliminacion a proposito.
export interface IPagosRepository {
  crear(data: CrearPagoData): Promise<Pago>;
  buscarPorPedido(
    params: BuscarPagosPorPedidoParams,
  ): Promise<{ data: Pago[]; total: number }>;
  /** Suma de `monto` (nunca `montoRecibido`) de todos los pagos de un pedido — usado por el resumen. */
  sumarMontoPorPedido(pedidoId: bigint): Promise<number>;
}
