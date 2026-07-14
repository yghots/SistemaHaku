import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { FotoEntregaInputDto } from './foto-entrega-input.dto';

export class ConfirmarEntregaDto {
  @ApiProperty({
    description: 'Id del perfil de motorizado que confirma la entrega',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  motorizadoId: number;

  @ApiProperty({
    description: 'Una o varias fotos de la entrega',
    type: [FotoEntregaInputDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FotoEntregaInputDto)
  fotos: FotoEntregaInputDto[];

  @ApiPropertyOptional({
    description: 'Observaciones registradas al confirmar la entrega',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
