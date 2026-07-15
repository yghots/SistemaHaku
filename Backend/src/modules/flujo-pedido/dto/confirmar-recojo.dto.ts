import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/**
 * Fase 22: la foto de recojo ya no viaja en el body como URL — se recibe
 * como archivo (`multipart/form-data`, campo `foto`), extraido en el
 * controller via `@UploadedFile()` y validado por
 * `foto-entrega.validator.ts`. Este DTO solo cubre los campos de texto.
 */
export class ConfirmarRecojoDto {
  @ApiProperty({
    description: 'Id del perfil de motorizado que confirma el recojo',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId: number;
}
