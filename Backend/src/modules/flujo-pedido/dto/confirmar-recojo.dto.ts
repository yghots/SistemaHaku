import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class ConfirmarRecojoDto {
  @ApiProperty({
    description: 'Id del perfil de motorizado que confirma el recojo',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId: number;

  @ApiProperty({
    description:
      'URL de la foto del recojo (no se sube el archivo, solo la URL)',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  urlImagen: string;
}
