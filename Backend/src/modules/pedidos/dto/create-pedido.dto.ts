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

export class CreatePedidoDto {
  @ApiProperty({ description: 'Id de la sucursal de recojo (obligatorio)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sucursalId: number;

  @ApiProperty({ description: 'Id del cliente destinatario (obligatorio)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId: number;

  @ApiProperty({
    description:
      'Id del usuario administrador que registra el pedido (obligatorio)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  creadoPorId: number;

  @ApiProperty({
    description: 'Direccion de entrega (obligatorio)',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccionEntrega: string;

  @ApiPropertyOptional({
    description: 'Telefono de contacto; si no se llena, se usa el del cliente',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefonoContacto?: string;

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
    description: 'Observaciones del pedido',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
