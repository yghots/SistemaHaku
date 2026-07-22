import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoSolicitudPedido } from '@prisma/client';

export class SolicitudPedidoResponseDto {
  @ApiProperty({ description: 'Identificador unico de la solicitud' })
  id: string;

  @ApiProperty({ description: 'Id de la sucursal de recojo' })
  sucursalId: string;

  @ApiProperty({ description: 'Nombre completo de quien solicita el pedido' })
  nombreCompleto: string;

  @ApiProperty({ description: 'Telefono de contacto' })
  telefono: string;

  @ApiProperty({ description: 'Direccion de entrega' })
  direccionEntrega: string;

  @ApiPropertyOptional({
    description: 'Descripcion del producto',
    nullable: true,
  })
  descripcionProducto: string | null;

  @ApiPropertyOptional({ description: 'Valor del producto', nullable: true })
  valorProducto: string | null;

  @ApiPropertyOptional({ description: 'Costo de envio', nullable: true })
  costoEnvio: string | null;

  @ApiPropertyOptional({
    description: 'Observaciones de la solicitud',
    nullable: true,
  })
  observaciones: string | null;

  @ApiProperty({
    description: 'Estado actual de la solicitud',
    enum: EstadoSolicitudPedido,
  })
  estado: EstadoSolicitudPedido;

  @ApiPropertyOptional({
    description: 'Motivo del rechazo, solo si estado es rechazada',
    nullable: true,
  })
  motivoRechazo: string | null;

  @ApiPropertyOptional({
    description: 'Id del cliente creado/actualizado al aprobar',
    nullable: true,
  })
  clienteId: string | null;

  @ApiPropertyOptional({
    description: 'Id del pedido creado al aprobar',
    nullable: true,
  })
  pedidoId: string | null;

  @ApiProperty({ description: 'Fecha y hora de creacion de la solicitud' })
  creadoEn: Date;

  @ApiPropertyOptional({
    description: 'Fecha y hora en que se aprobo o rechazo la solicitud',
    nullable: true,
  })
  revisadoEn: Date | null;

  constructor(partial: SolicitudPedidoResponseDto) {
    Object.assign(this, partial);
  }
}
