import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// Fase 29 (correccion A13 de la auditoria): los limites de longitud de
// estos 3 filtros son exactamente los mismos ya definidos en
// `CreateClienteDto` para el campo equivalente (`nombreCompleto`,
// `telefono`, `documentoIdentidad`) — antes de esta correccion, el filtro
// de busqueda no tenia ningun tope, inconsistente con el contrato de
// escritura del mismo campo.
export class ListClientesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial del nombre completo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial del telefono',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial del documento de identidad',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentoIdentidad?: string;
}
