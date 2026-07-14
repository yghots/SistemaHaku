import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoIncidente } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

// class-transformer's @Type(() => Boolean) hace Boolean(valor), y
// Boolean("false") es true en JS: rompia el filtro `?resuelto=false`
// (Fase 11). Se reemplaza por un parser explicito que solo reconoce
// 'true'/'1' y 'false'/'0'; cualquier otro valor se deja intacto para
// que @IsBoolean lo rechace con 400 (Fase 12, Correccion 1).
//
// El ValidationPipe global usa enableImplicitConversion: true. Sin un
// @Type() explicito, class-transformer igual detecta por reflect-metadata
// que esta propiedad es "boolean" y aplica su propio Boolean(valor) ANTES
// de correr @Transform, pisando el resultado. @Type(() => String) evita
// esa conversion implicita (String(valor) es identidad para el string que
// realmente llega desde el query), dejando que @Transform reciba el
// string original sin tocar.
function parseBooleanQueryParam(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  return value;
}

export class ListIncidentesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por id de pedido' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pedidoId?: number;

  @ApiPropertyOptional({ description: 'Filtra por id de motorizado' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId?: number;

  @ApiPropertyOptional({
    description: 'Filtra por tipo de incidente',
    enum: TipoIncidente,
  })
  @IsOptional()
  @IsEnum(TipoIncidente)
  tipo?: TipoIncidente;

  @ApiPropertyOptional({
    description:
      'Filtra por si el incidente ya fue atendido (acepta true/false o 1/0)',
  })
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }: { value: unknown }) => parseBooleanQueryParam(value))
  @IsBoolean({
    message: 'resuelto debe ser un valor booleano (true, false, 1 o 0)',
  })
  resuelto?: boolean;
}
