import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoSolicitudPedido } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListSolicitudesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por estado de la solicitud',
    enum: EstadoSolicitudPedido,
  })
  @IsOptional()
  @IsEnum(EstadoSolicitudPedido)
  estado?: EstadoSolicitudPedido;

  @ApiPropertyOptional({
    description: 'Filtra por id de tienda (a traves de la sucursal)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tiendaId?: number;

  @ApiPropertyOptional({ description: 'Filtra por id de sucursal' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sucursalId?: number;

  @ApiPropertyOptional({
    description: 'Filtra solicitudes creadas desde esta fecha (inclusive)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaDesde?: Date;

  @ApiPropertyOptional({
    description: 'Filtra solicitudes creadas hasta esta fecha (inclusive)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaHasta?: Date;
}
