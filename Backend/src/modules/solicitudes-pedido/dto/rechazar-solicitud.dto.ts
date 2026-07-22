import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RechazarSolicitudDto {
  @ApiProperty({
    description: 'Motivo del rechazo de la solicitud',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivoRechazo: string;
}
