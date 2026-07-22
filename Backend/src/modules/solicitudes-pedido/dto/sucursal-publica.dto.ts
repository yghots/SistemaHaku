import { ApiProperty } from '@nestjs/swagger';

// Solo id/nombre a proposito (endpoint publico, sin autenticacion): nunca
// exponer direccion/telefono/referencia u otro dato administrativo de la
// sucursal por esta via.
export class SucursalPublicaDto {
  @ApiProperty({ description: 'Identificador unico de la sucursal' })
  id: string;

  @ApiProperty({ description: 'Nombre de la sucursal' })
  nombre: string;

  constructor(partial: SucursalPublicaDto) {
    Object.assign(this, partial);
  }
}
