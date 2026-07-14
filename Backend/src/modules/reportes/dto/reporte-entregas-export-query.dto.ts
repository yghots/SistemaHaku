import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { FORMATOS_EXPORTACION } from '../../../common/exports/export.types';
import type { FormatoExportacion } from '../../../common/exports/export.types';
import { ReporteEntregasQueryDto } from './reporte-entregas-query.dto';

/** Mismos filtros que `ReporteEntregasQueryDto`, sin `page`/`limit` (ver `ReportePedidosExportQueryDto` para el razonamiento completo). */
export class ReporteEntregasExportQueryDto extends OmitType(
  ReporteEntregasQueryDto,
  ['page', 'limit'] as const,
) {
  @ApiProperty({
    description: 'Formato de exportacion',
    enum: FORMATOS_EXPORTACION,
  })
  @IsIn(FORMATOS_EXPORTACION)
  formato: FormatoExportacion;

  @ApiProperty({
    description:
      'Nombre de quien genera la exportacion (no hay JWT: se recibe explicito)',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  generadoPor: string;
}
