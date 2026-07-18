import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// Fase 29 (correccion A13 de la auditoria): mismo limite ya definido en
// `CreateTiendaDto.nombre`.
export class ListTiendasQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial del nombre',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;
}
