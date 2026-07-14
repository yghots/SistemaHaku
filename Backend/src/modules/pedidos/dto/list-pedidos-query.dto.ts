import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPedido } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListPedidosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial del codigo de pedido',
  })
  @IsOptional()
  @IsString()
  codigoPedido?: string;

  @ApiPropertyOptional({ description: 'Filtra por id de cliente' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId?: number;

  @ApiPropertyOptional({ description: 'Filtra por id de sucursal' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sucursalId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por estado del pedido',
    enum: EstadoPedido,
  })
  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;

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
}
