import { Sucursal } from '@prisma/client';
import { SucursalResponseDto } from './dto/sucursal-response.dto';

export class SucursalesMapper {
  static toResponseDto(sucursal: Sucursal): SucursalResponseDto {
    return new SucursalResponseDto({
      id: sucursal.id.toString(),
      tiendaId: sucursal.tiendaId.toString(),
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      referencia: sucursal.referencia,
      telefono: sucursal.telefono,
      esPrincipal: sucursal.esPrincipal,
    });
  }

  static toResponseDtoList(sucursales: Sucursal[]): SucursalResponseDto[] {
    return sucursales.map((sucursal) =>
      SucursalesMapper.toResponseDto(sucursal),
    );
  }
}
