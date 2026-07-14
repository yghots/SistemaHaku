import { ApiProperty } from '@nestjs/swagger';
import { EstadoMotorizado } from '@prisma/client';

export class PerfilMotorizadoResponseDto {
  @ApiProperty({ description: 'Identificador unico del perfil' })
  id: string;

  @ApiProperty({ description: 'Id del usuario asociado' })
  usuarioId: string;

  @ApiProperty({ description: 'Placa del vehiculo que usa' })
  placa: string;

  @ApiProperty({
    description: 'Estado operativo del motorizado',
    enum: EstadoMotorizado,
  })
  estado: EstadoMotorizado;

  constructor(partial: PerfilMotorizadoResponseDto) {
    Object.assign(this, partial);
  }
}
