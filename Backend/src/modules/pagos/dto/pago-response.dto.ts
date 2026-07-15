import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoPago } from '@prisma/client';

export class PagoResponseDto {
  @ApiProperty({ description: 'Identificador unico del pago' })
  id: string;

  @ApiProperty({ description: 'Id del pedido asociado' })
  pedidoId: string;

  @ApiProperty({ description: 'Metodo de pago', enum: MetodoPago })
  metodoPago: MetodoPago;

  @ApiProperty({ description: 'Monto abonado' })
  monto: string;

  @ApiPropertyOptional({
    description: 'Monto recibido en efectivo (solo metodoPago = efectivo)',
    nullable: true,
  })
  montoRecibido: string | null;

  @ApiPropertyOptional({
    description: 'Vuelto entregado (solo metodoPago = efectivo)',
    nullable: true,
  })
  vuelto: string | null;

  @ApiPropertyOptional({ description: 'Observacion del pago', nullable: true })
  observacion: string | null;

  @ApiProperty({ description: 'Id del usuario que registro el pago' })
  creadoPorId: string;

  @ApiProperty({ description: 'Fecha y hora de registro del pago' })
  creadoEn: Date;

  constructor(partial: PagoResponseDto) {
    Object.assign(this, partial);
  }
}
