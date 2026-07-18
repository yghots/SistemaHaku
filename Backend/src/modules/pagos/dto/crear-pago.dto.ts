import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoPago } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

// Fase 32 (correccion N6 de la auditoria de certificacion): tope maximo de
// `Pago.monto`/`montoRecibido` (`Decimal(10,2)` en el schema) — sin este
// limite, un valor que excede la capacidad de la columna pasaba
// class-validator y fallaba recien en Prisma, devuelto como 500 generico
// en vez de un 400 de validacion.
const MONTO_MAXIMO = 99_999_999.99;

export class CrearPagoDto {
  @ApiProperty({ description: 'Metodo de pago', enum: MetodoPago })
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  @ApiProperty({ description: 'Monto abonado (debe ser mayor a 0)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MONTO_MAXIMO)
  monto: number;

  @ApiPropertyOptional({
    description:
      'Monto recibido en efectivo — obligatorio unicamente cuando metodoPago es "efectivo"; debe ser mayor o igual a `monto`',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MONTO_MAXIMO)
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
