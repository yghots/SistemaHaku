import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { FormatoImportacionQueryDto } from './formato-importacion-query.dto';

export class ConfirmarImportacionQueryDto extends FormatoImportacionQueryDto {
  @ApiProperty({
    description:
      'Id del usuario que confirma la importacion (no hay JWT: se recibe explicito)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId: number;
}
