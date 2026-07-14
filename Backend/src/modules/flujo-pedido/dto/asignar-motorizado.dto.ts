import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AsignarMotorizadoDto {
  @ApiProperty({ description: 'Id del perfil de motorizado a asignar' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId: number;

  @ApiProperty({
    description: 'Id del usuario administrador que realiza la asignacion',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId: number;
}
