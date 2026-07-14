import { ApiProperty } from '@nestjs/swagger';
import { EstadoMotorizado } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePerfilMotorizadoDto {
  @ApiProperty({
    description: 'Id del usuario (rol motorizado) al que se asocia el perfil',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId: number;

  @ApiProperty({ description: 'Placa del vehiculo que usa', maxLength: 15 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  placa: string;

  @ApiProperty({
    description: 'Estado operativo del motorizado',
    enum: EstadoMotorizado,
  })
  @IsEnum(EstadoMotorizado)
  estado: EstadoMotorizado;
}
