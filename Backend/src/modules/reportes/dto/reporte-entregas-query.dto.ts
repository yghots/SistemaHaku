import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPedido } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ReporteEntregasQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra pedidos creados desde esta fecha (inclusive)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaDesde?: Date;

  @ApiPropertyOptional({
    description: 'Filtra pedidos creados hasta esta fecha (inclusive)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaHasta?: Date;

  @ApiPropertyOptional({
    description:
      'Restringe el reporte a un unico estado final. Debe ser entregado, cancelado, devuelto o reprogramado; sin este filtro se incluyen los cuatro',
    enum: EstadoPedido,
  })
  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;
}
