import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class RegistrarClienteAusenteDto {
  @ApiProperty({
    description:
      'Id del perfil de motorizado que registra la ausencia del cliente',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId: number;
}
