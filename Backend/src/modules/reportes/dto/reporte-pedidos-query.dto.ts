import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPedido } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ReportePedidosQueryDto extends PaginationQueryDto {
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

  @ApiPropertyOptional({ description: 'Filtra por id de tienda' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tiendaId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por estado del pedido',
    enum: EstadoPedido,
  })
  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;

  @ApiPropertyOptional({ description: 'Filtra por id de motorizado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId?: number;
}
