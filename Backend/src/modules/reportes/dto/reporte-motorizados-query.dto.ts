import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ReporteMotorizadosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por id de motorizado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId?: number;

  @ApiPropertyOptional({
    description:
      'Acota los conteos de pedidos atendidos y entregas a pedidos creados desde esta fecha (inclusive). No afecta el conteo de incidentes: el modelo actual no registra fecha de creacion en incidentes',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaDesde?: Date;

  @ApiPropertyOptional({
    description:
      'Acota los conteos de pedidos atendidos y entregas a pedidos creados hasta esta fecha (inclusive). No afecta el conteo de incidentes: el modelo actual no registra fecha de creacion en incidentes',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaHasta?: Date;
}
