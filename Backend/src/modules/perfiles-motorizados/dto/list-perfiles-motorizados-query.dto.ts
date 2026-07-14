import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoMotorizado } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListPerfilesMotorizadosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por id de usuario' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por estado operativo',
    enum: EstadoMotorizado,
  })
  @IsOptional()
  @IsEnum(EstadoMotorizado)
  estado?: EstadoMotorizado;

  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial de la placa',
  })
  @IsOptional()
  @IsString()
  placa?: string;
}
