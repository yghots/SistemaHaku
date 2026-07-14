import { Tienda } from '@prisma/client';
import { TiendaResponseDto } from './dto/tienda-response.dto';

export class TiendasMapper {
  static toResponseDto(tienda: Tienda): TiendaResponseDto {
    return new TiendaResponseDto({
      id: tienda.id.toString(),
      nombre: tienda.nombre,
      ruc: tienda.ruc,
      activo: tienda.activo,
    });
  }

  static toResponseDtoList(tiendas: Tienda[]): TiendaResponseDto[] {
    return tiendas.map((tienda) => TiendasMapper.toResponseDto(tienda));
  }
}
