import { Injectable } from '@nestjs/common';
import { HistorialPedido } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BuscarHistorialPorPedidoParams,
  IHistorialPedidoRepository,
} from './interfaces/historial-pedido-repository.interface';

@Injectable()
export class HistorialPedidoRepository implements IHistorialPedidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorPedido(
    params: BuscarHistorialPorPedidoParams,
  ): Promise<{ data: HistorialPedido[]; total: number }> {
    const where = { pedidoId: params.pedidoId };

    const [data, total] = await Promise.all([
      this.prisma.historialPedido.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.historialPedido.count({ where }),
    ]);

    return { data, total };
  }
}
