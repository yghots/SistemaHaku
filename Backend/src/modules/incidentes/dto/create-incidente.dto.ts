import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoIncidente } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class CreateIncidenteDto {
  @ApiPropertyOptional({ description: 'Id del pedido afectado, si aplica' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pedidoId?: number;

  @ApiProperty({
    description: 'Id del perfil de motorizado que reporta el incidente',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId: number;

  @ApiProperty({ description: 'Tipo de incidente', enum: TipoIncidente })
  @IsEnum(TipoIncidente)
  tipo: TipoIncidente;
}
