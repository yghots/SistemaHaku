import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// Fase 29 (correccion A13 de la auditoria): mismo limite ya definido en
// `CreatePerfilMotorizadoDto.placa`.
export class ListPerfilesMotorizadosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por id de usuario' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial de la placa',
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  placa?: string;
}
