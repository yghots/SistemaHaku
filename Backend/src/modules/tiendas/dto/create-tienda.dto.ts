import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTiendaDto {
  @ApiProperty({ description: 'Razon comercial de la tienda', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Documento tributario, opcional',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  ruc?: string;
}
