import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClienteDto {
  @ApiProperty({ description: 'Nombre completo del cliente', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombreCompleto: string;

  @ApiProperty({ description: 'Telefono de contacto, editable', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telefono: string;

  @ApiProperty({
    description: 'Direccion de entrega, editable',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccion: string;

  @ApiPropertyOptional({
    description: 'Documento de identidad, opcional',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentoIdentidad?: string;
}
