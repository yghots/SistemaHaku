import { Pedido } from '@prisma/client';
import type { ResumenPagoPedidoCalculado } from '../../common/utils/estado-pago-pedido.util';
import { PedidoResponseDto } from './dto/pedido-response.dto';

export class PedidosMapper {
  /**
   * `resumenPago` (Fase 21) siempre viene ya calculado por el servicio
   * (`PedidosService`, via `common/utils/estado-pago-pedido.util.ts`) — el
   * mapper nunca calcula, solo traduce a la forma de respuesta.
   */
  static toResponseDto(
    pedido: Pedido,
    resumenPago: ResumenPagoPedidoCalculado,
  ): PedidoResponseDto {
    return new PedidoResponseDto({
      id: pedido.id.toString(),
      codigoPedido: pedido.codigoPedido,
      sucursalId: pedido.sucursalId.toString(),
      clienteId: pedido.clienteId.toString(),
      motorizadoActualId: pedido.motorizadoActualId?.toString() ?? null,
      creadoPorId: pedido.creadoPorId.toString(),
      direccionEntrega: pedido.direccionEntrega,
      telefonoContacto: pedido.telefonoContacto,
      descripcionProducto: pedido.descripcionProducto,
      valorProducto: pedido.valorProducto?.toString() ?? null,
      costoEnvio: pedido.costoEnvio?.toString() ?? null,
      estado: pedido.estado,
      observaciones: pedido.observaciones,
      creadoEn: pedido.creadoEn,
      estadoPago: resumenPago.estadoPago,
      saldoPendiente: resumenPago.saldoPendiente.toFixed(2),
    });
  }

  static toResponseDtoList(
    pedidos: Pedido[],
    resumenPagoPorPedido: Map<string, ResumenPagoPedidoCalculado>,
  ): PedidoResponseDto[] {
    return pedidos.map((pedido) =>
      PedidosMapper.toResponseDto(
        pedido,
        resumenPagoPorPedido.get(pedido.id.toString()) ?? {
          totalPedido: 0,
          totalPagado: 0,
          saldoPendiente: 0,
          estadoPago: 'sin_pago',
        },
      ),
    );
  }
}
