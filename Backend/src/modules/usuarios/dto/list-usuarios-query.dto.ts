import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListUsuariosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial del nombre de usuario',
  })
  @IsOptional()
  @IsString()
  usuario?: string;

  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial del correo',
  })
  @IsOptional()
  @IsString()
  correo?: string;
}
