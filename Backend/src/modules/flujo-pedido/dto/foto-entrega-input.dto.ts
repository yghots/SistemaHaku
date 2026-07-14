import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class FotoEntregaInputDto {
  @ApiProperty({
    description:
      'URL de la imagen almacenada (no se sube el archivo, solo la URL)',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  urlImagen: string;

  @ApiPropertyOptional({
    description: 'Marca esta foto como la principal de su tipo',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}
