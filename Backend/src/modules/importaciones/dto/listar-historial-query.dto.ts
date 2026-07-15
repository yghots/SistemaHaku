import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListarHistorialQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por entidad importada',
    enum: ['cliente', 'tienda', 'motorizado'],
  })
  @IsOptional()
  @IsIn(['cliente', 'tienda', 'motorizado'])
  entidad?: 'cliente' | 'tienda' | 'motorizado';
}
