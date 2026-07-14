import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TiendaResponseDto {
  @ApiProperty({ description: 'Identificador unico de la tienda' })
  id: string;

  @ApiProperty({ description: 'Razon comercial de la tienda' })
  nombre: string;

  @ApiPropertyOptional({ description: 'Documento tributario', nullable: true })
  ruc: string | null;

  @ApiProperty({ description: 'Indica si la tienda esta activa' })
  activo: boolean;

  constructor(partial: TiendaResponseDto) {
    Object.assign(this, partial);
  }
}
