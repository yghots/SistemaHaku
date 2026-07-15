import { ApiProperty } from '@nestjs/swagger';

export class ImportacionHistorialItemDto {
  @ApiProperty({ description: 'Id del historial' })
  id: string;

  @ApiProperty({
    description: 'Entidad importada',
    enum: ['cliente', 'tienda', 'motorizado'],
  })
  entidad: 'cliente' | 'tienda' | 'motorizado';

  @ApiProperty({ description: 'Nombre del archivo importado' })
  archivoNombre: string;

  @ApiProperty({
    description: 'Formato del archivo',
    enum: ['xlsx', 'json', 'xml'],
  })
  formato: 'xlsx' | 'json' | 'xml';

  @ApiProperty({ description: 'Id del usuario que confirmo la importacion' })
  usuarioId: string;

  @ApiProperty({
    description: 'Nombre completo del usuario que confirmo la importacion',
  })
  usuarioNombre: string;

  @ApiProperty({ description: 'Total de registros encontrados en el archivo' })
  totalEncontrados: number;

  @ApiProperty({ description: 'Registros efectivamente importados' })
  importados: number;

  @ApiProperty({ description: 'Registros omitidos por ya existir' })
  duplicados: number;

  @ApiProperty({ description: 'Registros con datos invalidos' })
  errores: number;

  @ApiProperty({ description: 'Tiempo de procesamiento en milisegundos' })
  tiempoProcesamientoMs: number;

  @ApiProperty({
    description: 'Estado final del procesamiento',
    enum: ['completado', 'parcial'],
  })
  estado: 'completado' | 'parcial';

  @ApiProperty({ description: 'Fecha y hora de la importacion' })
  creadoEn: Date;
}
