import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PedidosService } from '../pedidos/pedidos.service';
import { HistorialPedidoResponseDto } from './dto/historial-pedido-response.dto';
import { HISTORIAL_PEDIDO_REPOSITORY } from './interfaces/historial-pedido-repository.interface';
import type { IHistorialPedidoRepository } from './interfaces/historial-pedido-repository.interface';
import { HistorialPedidoMapper } from './historial-pedido.mapper';

@Injectable()
export class HistorialPedidoService {
  constructor(
    @Inject(HISTORIAL_PEDIDO_REPOSITORY)
    private readonly historialPedidoRepository: IHistorialPedidoRepository,
    private readonly pedidosService: PedidosService,
  ) {}

  async buscarPorPedido(
    pedidoId: bigint,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<HistorialPedidoResponseDto>> {
    // Lanza NotFoundException si el pedido no existe.
    await this.pedidosService.buscarPorId(pedidoId);

    const { data, total } =
      await this.historialPedidoRepository.buscarPorPedido({
        pedidoId,
        skip: query.skip,
        take: query.limit,
      });

    return new PaginatedResponseDto(
      HistorialPedidoMapper.toResponseDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }
}
