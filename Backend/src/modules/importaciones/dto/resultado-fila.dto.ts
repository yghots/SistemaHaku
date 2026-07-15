import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResultadoFilaDto {
  @ApiProperty({
    description:
      'Numero de fila dentro del archivo (1 = primer registro de datos)',
  })
  fila: number;

  @ApiProperty({
    description: 'Resultado de la fila',
    enum: ['duplicado', 'invalido'],
  })
  estado: 'duplicado' | 'invalido';

  @ApiProperty({ description: 'Motivo legible del resultado' })
  motivo: string;

  @ApiPropertyOptional({ description: 'Campo afectado, si aplica' })
  campo?: string;

  @ApiPropertyOptional({
    description: 'Valor recibido para el campo afectado, si aplica',
  })
  valor?: string;
}
