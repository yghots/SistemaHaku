import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

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
  nombre?: string;
}
