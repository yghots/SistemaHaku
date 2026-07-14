import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PedidosService } from '../pedidos/pedidos.service';
import { FotoEntregaResponseDto } from './dto/foto-entrega-response.dto';
import { FOTOS_ENTREGA_REPOSITORY } from './interfaces/fotos-entrega-repository.interface';
import type { IFotosEntregaRepository } from './interfaces/fotos-entrega-repository.interface';
import { FotosEntregaMapper } from './fotos-entrega.mapper';

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
}
