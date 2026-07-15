import { Injectable } from '@nestjs/common';
import { FotoEntrega } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BuscarFotosPorPedidoParams,
  IFotosEntregaRepository,
} from './interfaces/fotos-entrega-repository.interface';

@Injectable()
export class FotosEntregaRepository implements IFotosEntregaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorPedido(
    params: BuscarFotosPorPedidoParams,
  ): Promise<{ data: FotoEntrega[]; total: number }> {
    const where = { pedidoId: params.pedidoId };

    const [data, total] = await Promise.all([
      this.prisma.fotoEntrega.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { id: 'asc' },
      }),
      this.prisma.fotoEntrega.count({ where }),
    ]);

    return { data, total };
  }

  buscarPorId(id: bigint): Promise<FotoEntrega | null> {
    return this.prisma.fotoEntrega.findUnique({ where: { id } });
  }
}
