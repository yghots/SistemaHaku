import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ReasignarMotorizadoDto {
  @ApiProperty({
    description: 'Id del perfil de motorizado actualmente asignado al pedido',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoAnteriorId: number;

  @ApiProperty({ description: 'Id del nuevo perfil de motorizado a asignar' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoNuevoId: number;

  @ApiProperty({
    description: 'Id del usuario administrador que realiza la reasignacion',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId: number;
}
