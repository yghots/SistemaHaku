import { FotoEntrega } from '@prisma/client';
import { FotoEntregaResponseDto } from './dto/foto-entrega-response.dto';

export class FotosEntregaMapper {
  static toResponseDto(foto: FotoEntrega): FotoEntregaResponseDto {
    return new FotoEntregaResponseDto({
      id: foto.id.toString(),
      pedidoId: foto.pedidoId.toString(),
      motorizadoId: foto.motorizadoId.toString(),
      tipo: foto.tipo,
      urlImagen: foto.urlImagen,
      esPrincipal: foto.esPrincipal,
    });
  }

  static toResponseDtoList(fotos: FotoEntrega[]): FotoEntregaResponseDto[] {
    return fotos.map((foto) => FotosEntregaMapper.toResponseDto(foto));
  }
}
