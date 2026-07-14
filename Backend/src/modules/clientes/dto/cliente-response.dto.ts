import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClienteResponseDto {
  @ApiProperty({ description: 'Identificador unico del cliente' })
  id: string;

  @ApiProperty({ description: 'Nombre completo del cliente' })
  nombreCompleto: string;

  @ApiProperty({ description: 'Telefono de contacto' })
  telefono: string;

  @ApiProperty({ description: 'Direccion de entrega' })
  direccion: string;

  @ApiPropertyOptional({
    description: 'Documento de identidad',
    nullable: true,
  })
  documentoIdentidad: string | null;

  constructor(partial: ClienteResponseDto) {
    Object.assign(this, partial);
  }
}
