import { ApiProperty } from '@nestjs/swagger';
import { ImportacionHistorialItemDto } from './importacion-historial-item.dto';
import { ResultadoFilaDto } from './resultado-fila.dto';

export class ImportacionHistorialDetalleDto extends ImportacionHistorialItemDto {
  @ApiProperty({
    description:
      'Detalle de las filas duplicadas o invalidas (las importadas no se listan)',
    type: [ResultadoFilaDto],
  })
  filas: ResultadoFilaDto[];
}
