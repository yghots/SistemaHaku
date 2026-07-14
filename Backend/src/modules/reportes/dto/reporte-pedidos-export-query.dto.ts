import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { FORMATOS_EXPORTACION } from '../../../common/exports/export.types';
import type { FormatoExportacion } from '../../../common/exports/export.types';
import { ReportePedidosQueryDto } from './reporte-pedidos-query.dto';

/**
 * Mismos filtros que `ReportePedidosQueryDto` (Fase 18: la exportacion
 * nunca inventa un filtro nuevo), sin `page`/`limit` — la exportacion
 * siempre trae todas las filas que coincidan con el filtro, nunca una
 * sola pagina.
 */
export class ReportePedidosExportQueryDto extends OmitType(
  ReportePedidosQueryDto,
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
