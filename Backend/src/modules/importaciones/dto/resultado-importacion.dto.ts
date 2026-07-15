import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResultadoFilaDto } from './resultado-fila.dto';

/**
 * Forma de respuesta compartida por "analizar" (vista previa, sin
 * escribir nada) y "confirmar" (importacion real). `historialId`/`estado`
 * solo estan presentes tras confirmar — la vista previa nunca persiste
 * nada, por lo que no genera historial.
 */
export class ResultadoImportacionDto {
  @ApiPropertyOptional({
    description: 'Id del historial generado (solo presente al confirmar)',
  })
  historialId?: string;

  @ApiProperty({ description: 'Total de registros encontrados en el archivo' })
  totalEncontrados: number;

  @ApiProperty({
    description:
      'Registros validos (vista previa) o efectivamente importados (confirmacion)',
  })
  importados: number;

  @ApiProperty({
    description: 'Registros que ya existian (omitidos automaticamente)',
  })
  duplicados: number;

  @ApiProperty({ description: 'Registros con datos invalidos' })
  errores: number;

  @ApiPropertyOptional({
    description: 'Estado final del procesamiento (solo presente al confirmar)',
    enum: ['completado', 'parcial'],
  })
  estado?: 'completado' | 'parcial';

  @ApiProperty({ description: 'Tiempo de procesamiento en milisegundos' })
  tiempoProcesamientoMs: number;

  @ApiProperty({
    description:
      'Detalle de las filas duplicadas o invalidas (las importadas no se listan)',
    type: [ResultadoFilaDto],
  })
  filas: ResultadoFilaDto[];
}
