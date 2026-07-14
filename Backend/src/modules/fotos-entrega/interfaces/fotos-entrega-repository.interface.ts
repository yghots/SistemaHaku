import { FotoEntrega } from '@prisma/client';

export const FOTOS_ENTREGA_REPOSITORY = Symbol('FOTOS_ENTREGA_REPOSITORY');

export interface BuscarFotosPorPedidoParams {
  pedidoId: bigint;
  skip: number;
  take: number;
}

// Solo lectura: las fotos unicamente pueden registrarse durante Confirmar
// Recojo o Confirmar Entrega (modulo flujo-pedido). No existe metodo de
// creacion, actualizacion ni eliminacion aqui a proposito.
export interface IFotosEntregaRepository {
  buscarPorPedido(
    params: BuscarFotosPorPedidoParams,
  ): Promise<{ data: FotoEntrega[]; total: number }>;
}
