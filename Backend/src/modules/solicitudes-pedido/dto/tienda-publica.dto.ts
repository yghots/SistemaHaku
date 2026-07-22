import { ApiProperty } from '@nestjs/swagger';
import { SucursalPublicaDto } from './sucursal-publica.dto';

// Solo id/nombre a proposito (endpoint publico, sin autenticacion): nunca
// exponer ruc/activo u otro dato administrativo de la tienda por esta via.
export class TiendaPublicaDto {
  @ApiProperty({ description: 'Identificador unico de la tienda' })
  id: string;

  @ApiProperty({ description: 'Nombre de la tienda' })
  nombre: string;

  @ApiProperty({
    description: 'Sucursales activas de la tienda',
    type: [SucursalPublicaDto],
  })
  sucursales: SucursalPublicaDto[];

  constructor(partial: TiendaPublicaDto) {
    Object.assign(this, partial);
  }
}
