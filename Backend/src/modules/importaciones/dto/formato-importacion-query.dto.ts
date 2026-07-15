import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { FORMATOS_IMPORTACION } from '../../../common/imports/import.types';
import type { FormatoImportacion } from '../../../common/imports/import.types';

export class FormatoImportacionQueryDto {
  @ApiProperty({
    description: 'Formato del archivo',
    enum: FORMATOS_IMPORTACION,
  })
  @IsIn(FORMATOS_IMPORTACION)
  formato: FormatoImportacion;
}
