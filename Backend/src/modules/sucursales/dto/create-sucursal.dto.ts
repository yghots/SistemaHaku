import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSucursalDto {
  @ApiProperty({
    description: 'Id de la tienda a la que pertenece la sucursal',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tiendaId: number;

  @ApiProperty({ description: 'Nombre de la sucursal', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiProperty({ description: 'Direccion fisica de recojo', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccion: string;

  @ApiPropertyOptional({
    description: 'Referencia adicional de ubicacion, opcional',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  referencia?: string;

  // Ver DEVELOPMENT_PROGRESS.md (Fase 4): la columna real es NOT NULL
  // (aprobado en Fase 2); se mantiene obligatorio hasta que se autorice
  // una migracion que la haga opcional.
  @ApiProperty({
    description: 'Telefono de contacto de la sucursal',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telefono: string;

  @ApiPropertyOptional({
    description: 'Marca la sucursal principal de la tienda',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}
