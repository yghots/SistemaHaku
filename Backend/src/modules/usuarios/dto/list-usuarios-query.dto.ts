import { ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
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

  @ApiPropertyOptional({
    description: 'Filtra por rol del usuario (Fase 25)',
    enum: RolUsuario,
  })
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;
}
