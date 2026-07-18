import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// Fase 29 (correccion A13 de la auditoria): mismo limite ya definido en
// `CreateSucursalDto.nombre`.
export class ListSucursalesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por id de tienda' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tiendaId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial del nombre',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;
}
