import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AprobarSolicitudDto {
  @ApiProperty({
    description:
      'Id del usuario administrador que aprueba la solicitud (queda registrado como creadoPorId del Pedido generado)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId: number;
}
