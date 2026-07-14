import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPedido, TipoEventoHistorial } from '@prisma/client';

export class HistorialPedidoResponseDto {
  @ApiProperty({ description: 'Identificador unico del evento' })
  id: string;

  @ApiProperty({ description: 'Id del pedido al que pertenece el evento' })
  pedidoId: string;

  @ApiProperty({
    description: 'Tipo de evento registrado',
    enum: TipoEventoHistorial,
  })
  tipoEvento: TipoEventoHistorial;

  @ApiPropertyOptional({
    description: 'Estado del pedido (usado cuando tipoEvento es cambio_estado)',
    enum: EstadoPedido,
    nullable: true,
  })
  estado: EstadoPedido | null;

  @ApiPropertyOptional({
    description: 'Id del motorizado (usado cuando tipoEvento es reasignacion)',
    nullable: true,
  })
  motorizadoId: string | null;

  @ApiProperty({ description: 'Id del usuario que genero el evento' })
  usuarioId: string;

  @ApiProperty({ description: 'Fecha y hora del evento' })
  createdAt: Date;

  constructor(partial: HistorialPedidoResponseDto) {
    Object.assign(this, partial);
  }
}
