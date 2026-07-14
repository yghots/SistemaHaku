import { HistorialPedido } from '@prisma/client';
import { HistorialPedidoResponseDto } from './dto/historial-pedido-response.dto';

export class HistorialPedidoMapper {
  static toResponseDto(evento: HistorialPedido): HistorialPedidoResponseDto {
    return new HistorialPedidoResponseDto({
      id: evento.id.toString(),
      pedidoId: evento.pedidoId.toString(),
      tipoEvento: evento.tipoEvento,
      estado: evento.estado,
      motorizadoId: evento.motorizadoId?.toString() ?? null,
      usuarioId: evento.usuarioId.toString(),
      createdAt: evento.createdAt,
    });
  }

  static toResponseDtoList(
    eventos: HistorialPedido[],
  ): HistorialPedidoResponseDto[] {
    return eventos.map((evento) => HistorialPedidoMapper.toResponseDto(evento));
  }
}
