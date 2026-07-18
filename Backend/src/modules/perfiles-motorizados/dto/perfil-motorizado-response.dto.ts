import { ApiProperty } from '@nestjs/swagger';

export class PerfilMotorizadoResponseDto {
  @ApiProperty({ description: 'Identificador unico del perfil' })
  id: string;

  @ApiProperty({ description: 'Id del usuario asociado' })
  usuarioId: string;

  @ApiProperty({ description: 'Nombres del usuario asociado (Fase 17)' })
  nombres: string;

  @ApiProperty({ description: 'Apellidos del usuario asociado (Fase 17)' })
  apellidos: string;

  @ApiProperty({ description: 'Placa del vehiculo que usa' })
  placa: string;

  constructor(partial: PerfilMotorizadoResponseDto) {
    Object.assign(this, partial);
  }
}
