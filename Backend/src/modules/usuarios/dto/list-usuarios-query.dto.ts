import { ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { parseBooleanQueryParam } from '../../../common/utils/parse-boolean-query-param.util';

// Fase 29 (correccion A13 de la auditoria): mismos limites ya definidos en
// `CreateUsuarioDto.usuario`/`.correo`.
export class ListUsuariosQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial del nombre de usuario',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  usuario?: string;

  @ApiPropertyOptional({
    description: 'Filtra por coincidencia parcial del correo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  correo?: string;

  @ApiPropertyOptional({
    description: 'Filtra por rol del usuario (Fase 25)',
    enum: RolUsuario,
  })
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  // Fase 33 (Parte 3 del rediseno de ciclo de vida): sin este filtro, se
  // muestran usuarios activos e inactivos indistintamente (comportamiento
  // previo). El Frontend lo usa para mostrar solo activos por defecto, con
  // un selector Activos/Inactivos/Todos.
  @ApiPropertyOptional({
    description:
      'Filtra por si la cuenta esta activa (acepta true/false o 1/0)',
  })
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }: { value: unknown }) => parseBooleanQueryParam(value))
  @IsBoolean({
    message: 'activo debe ser un valor booleano (true, false, 1 o 0)',
  })
  activo?: boolean;
}
