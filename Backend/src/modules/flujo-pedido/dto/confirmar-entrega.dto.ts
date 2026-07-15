import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

/**
 * Fase 22: las fotos de entrega ya no viajan en el body como arreglo de
 * URLs — se reciben como archivos (`multipart/form-data`, campo `fotos`,
 * uno o varios), extraidos en el controller via `@UploadedFiles()` y
 * validados por `foto-entrega.validator.ts`. Este DTO solo cubre los
 * campos de texto que acompañan a los archivos.
 */
export class ConfirmarEntregaDto {
  @ApiProperty({
    description: 'Id del perfil de motorizado que confirma la entrega',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId: number;

  @ApiPropertyOptional({
    description:
      'Indice (0-based) de la foto marcada como principal dentro del arreglo de archivos "fotos" subido. Si se omite, ninguna foto queda marcada como principal.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fotoPrincipalIndex?: number;

  @ApiPropertyOptional({
    description: 'Observaciones registradas al confirmar la entrega',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
