import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoIncidente } from '@prisma/client';

export class IncidenteResponseDto {
  @ApiProperty({ description: 'Identificador unico del incidente' })
  id: string;

  @ApiPropertyOptional({
    description: 'Id del pedido afectado, si aplica',
    nullable: true,
  })
  pedidoId: string | null;

  @ApiProperty({
    description: 'Id del perfil de motorizado que reporto el incidente',
  })
  motorizadoId: string;

  @ApiProperty({ description: 'Tipo de incidente', enum: TipoIncidente })
  tipo: TipoIncidente;

  @ApiProperty({ description: 'Indica si el incidente ya fue atendido' })
  resuelto: boolean;

  constructor(partial: IncidenteResponseDto) {
    Object.assign(this, partial);
  }
}
