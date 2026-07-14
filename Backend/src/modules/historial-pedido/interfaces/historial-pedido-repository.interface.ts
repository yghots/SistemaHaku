import { HistorialPedido } from '@prisma/client';

export const HISTORIAL_PEDIDO_REPOSITORY = Symbol(
  'HISTORIAL_PEDIDO_REPOSITORY',
);

export interface BuscarHistorialPorPedidoParams {
  pedidoId: bigint;
  skip: number;
  take: number;
}

// Solo lectura: el historial se genera unicamente desde los casos de uso
// de negocio (modulo flujo-pedido). No existe metodo de creacion,
// actualizacion ni eliminacion aqui a proposito.
export interface IHistorialPedidoRepository {
  buscarPorPedido(
    params: BuscarHistorialPorPedidoParams,
  ): Promise<{ data: HistorialPedido[]; total: number }>;
}
