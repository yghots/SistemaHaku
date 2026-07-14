import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class IniciarRutaDto {
  @ApiProperty({
    description: 'Id del perfil de motorizado que inicia la ruta',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId: number;
}
