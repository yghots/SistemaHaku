import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSolicitudPublicaDto {
  @ApiProperty({ description: 'Id de la sucursal de recojo (obligatorio)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sucursalId: number;

  @ApiProperty({
    description: 'Nombre completo de quien solicita el pedido',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombreCompleto: string;

  @ApiProperty({ description: 'Telefono de contacto', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telefono: string;

  @ApiProperty({
    description: 'Direccion de entrega (obligatorio)',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccionEntrega: string;

  @ApiPropertyOptional({
    description: 'Descripcion simple del producto',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcionProducto?: string;

  @ApiPropertyOptional({ description: 'Valor del producto' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorProducto?: number;

  @ApiPropertyOptional({ description: 'Costo de envio' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costoEnvio?: number;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales de la solicitud',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
