import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class RegistrarRechazoDto {
  @ApiProperty({
    description: 'Id del perfil de motorizado que registra el rechazo',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId: number;
}
