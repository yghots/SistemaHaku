import { Pedido } from '@prisma/client';
import { PedidoResponseDto } from './dto/pedido-response.dto';

export class PedidosMapper {
  static toResponseDto(pedido: Pedido): PedidoResponseDto {
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
    });
  }

  static toResponseDtoList(pedidos: Pedido[]): PedidoResponseDto[] {
    return pedidos.map((pedido) => PedidosMapper.toResponseDto(pedido));
  }
}
