import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { assertFound } from '../../common/utils/assert-found.util';
import { PedidosService } from '../pedidos/pedidos.service';
import { FotoEntregaResponseDto } from './dto/foto-entrega-response.dto';
import { FOTOS_ENTREGA_REPOSITORY } from './interfaces/fotos-entrega-repository.interface';
import type { IFotosEntregaRepository } from './interfaces/fotos-entrega-repository.interface';
import { FotosEntregaMapper } from './fotos-entrega.mapper';

export interface ImagenFotoEntrega {
  imagen: Uint8Array<ArrayBuffer>;
  mimeType: string;
}

@Injectable()
export class FotosEntregaService {
  constructor(
    @Inject(FOTOS_ENTREGA_REPOSITORY)
    private readonly fotosEntregaRepository: IFotosEntregaRepository,
    private readonly pedidosService: PedidosService,
  ) {}

  async buscarPorPedido(
    pedidoId: bigint,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<FotoEntregaResponseDto>> {
    // Lanza NotFoundException si el pedido no existe.
    await this.pedidosService.buscarPorId(pedidoId);

    const { data, total } = await this.fotosEntregaRepository.buscarPorPedido({
      pedidoId,
      skip: query.skip,
      take: query.limit,
    });

    return new PaginatedResponseDto(
      FotosEntregaMapper.toResponseDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  /**
   * Sirve el binario de una foto (Fase 22) — lectura directa desde MySQL,
   * nunca desde disco. `pedidoId` se valida contra la foto encontrada para
   * que una foto de otro pedido nunca se sirva por esta ruta (evita
   * enumerar fotos ajenas cambiando solo `fotoId`).
   */
  async obtenerImagen(
    pedidoId: bigint,
    fotoId: bigint,
  ): Promise<ImagenFotoEntrega> {
    await this.pedidosService.buscarPorId(pedidoId);

    const foto = assertFound(
      await this.fotosEntregaRepository.buscarPorId(fotoId),
      'Foto no encontrada',
    );
    if (foto.pedidoId !== pedidoId) {
      throw new NotFoundException('Foto no encontrada');
    }

    return { imagen: foto.imagen, mimeType: foto.mimeType };
  }
}
