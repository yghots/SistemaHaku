import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CancelarPedidoDto {
  @ApiProperty({
    description: 'Id del usuario administrador que registra la cancelacion',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId: number;
}
