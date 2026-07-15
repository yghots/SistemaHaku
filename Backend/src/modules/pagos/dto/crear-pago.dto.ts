import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoPago } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CrearPagoDto {
  @ApiProperty({ description: 'Metodo de pago', enum: MetodoPago })
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  @ApiProperty({ description: 'Monto abonado (debe ser mayor a 0)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;

  @ApiPropertyOptional({
    description:
      'Monto recibido en efectivo — obligatorio unicamente cuando metodoPago es "efectivo"; debe ser mayor o igual a `monto`',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoRecibido?: number;

  @ApiPropertyOptional({
    description: 'Observacion libre del pago',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacion?: string;

  @ApiProperty({
    description:
      'Id del usuario que registra el pago (no hay JWT: se recibe explicito)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  creadoPorId: number;
}
