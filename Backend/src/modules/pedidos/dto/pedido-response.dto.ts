import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPedido } from '@prisma/client';

export class PedidoResponseDto {
  @ApiProperty({ description: 'Identificador unico del pedido' })
  id: string;

  @ApiProperty({ description: 'Codigo autogenerado del pedido (igual al id)' })
  codigoPedido: string;

  @ApiProperty({ description: 'Id de la sucursal de recojo' })
  sucursalId: string;

  @ApiProperty({ description: 'Id del cliente destinatario' })
  clienteId: string;

  @ApiPropertyOptional({
    description: 'Id del motorizado asignado actualmente',
    nullable: true,
  })
  motorizadoActualId: string | null;

  @ApiProperty({ description: 'Id del usuario que registro el pedido' })
  creadoPorId: string;

  @ApiProperty({ description: 'Direccion de entrega' })
  direccionEntrega: string;

  @ApiPropertyOptional({ description: 'Telefono de contacto', nullable: true })
  telefonoContacto: string | null;

  @ApiPropertyOptional({
    description: 'Descripcion del producto',
    nullable: true,
  })
  descripcionProducto: string | null;

  @ApiPropertyOptional({ description: 'Valor del producto', nullable: true })
  valorProducto: string | null;

  @ApiPropertyOptional({ description: 'Costo de envio', nullable: true })
  costoEnvio: string | null;

  @ApiProperty({ description: 'Estado actual del pedido', enum: EstadoPedido })
  estado: EstadoPedido;

  @ApiPropertyOptional({
    description: 'Observaciones del pedido',
    nullable: true,
  })
  observaciones: string | null;

  @ApiProperty({ description: 'Fecha y hora de creacion del pedido' })
  creadoEn: Date;

  constructor(partial: PedidoResponseDto) {
    Object.assign(this, partial);
  }
}
