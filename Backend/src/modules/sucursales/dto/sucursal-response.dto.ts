import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SucursalResponseDto {
  @ApiProperty({ description: 'Identificador unico de la sucursal' })
  id: string;

  @ApiProperty({ description: 'Id de la tienda a la que pertenece' })
  tiendaId: string;

  @ApiProperty({ description: 'Nombre de la sucursal' })
  nombre: string;

  @ApiProperty({ description: 'Direccion fisica de recojo' })
  direccion: string;

  @ApiPropertyOptional({
    description: 'Referencia adicional de ubicacion',
    nullable: true,
  })
  referencia: string | null;

  @ApiProperty({ description: 'Telefono de contacto' })
  telefono: string;

  @ApiProperty({ description: 'Marca la sucursal principal de la tienda' })
  esPrincipal: boolean;

  constructor(partial: SucursalResponseDto) {
    Object.assign(this, partial);
  }
}
