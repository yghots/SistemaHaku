import { ApiProperty } from '@nestjs/swagger';
import { EstadoPedido } from '@prisma/client';

export class ReportePedidoItemDto {
  @ApiProperty({ description: 'Identificador unico del pedido' })
  id: string;

  @ApiProperty({ description: 'Codigo del pedido' })
  codigoPedido: string;

  @ApiProperty({ description: 'Estado actual del pedido', enum: EstadoPedido })
  estado: EstadoPedido;

  @ApiProperty({ description: 'Fecha y hora de creacion del pedido' })
  creadoEn: Date;

  @ApiProperty({ description: 'Id de la sucursal de recojo' })
  sucursalId: string;

  @ApiProperty({ description: 'Nombre de la sucursal de recojo' })
  sucursalNombre: string;

  @ApiProperty({ description: 'Id de la tienda propietaria de la sucursal' })
  tiendaId: string;

  @ApiProperty({ description: 'Nombre de la tienda' })
  tiendaNombre: string;

  @ApiProperty({ description: 'Id del cliente destinatario' })
  clienteId: string;

  @ApiProperty({
    description: 'Id del motorizado asignado actualmente',
    nullable: true,
  })
  motorizadoActualId: string | null;

  constructor(partial: ReportePedidoItemDto) {
    Object.assign(this, partial);
  }
}
