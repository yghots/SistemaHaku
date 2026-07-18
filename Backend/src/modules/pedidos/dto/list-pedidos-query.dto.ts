import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPedido } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListPedidosQueryDto extends PaginationQueryDto {
  // Fase 32 (correccion N4 de la auditoria de certificacion): mismo limite
  // ya definido en `CreatePedidoDto`/columna `codigoPedido VarChar(30)` —
  // este filtro se quedo fuera de la correccion A13 (Fase 29), que cubrio
  // el resto de ListQueryDto del proyecto.
  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial del codigo de pedido',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
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
