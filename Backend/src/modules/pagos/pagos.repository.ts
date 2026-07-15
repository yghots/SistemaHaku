import { Injectable } from '@nestjs/common';
import { Pago } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BuscarPagosPorPedidoParams,
  CrearPagoData,
  IPagosRepository,
} from './interfaces/pagos-repository.interface';

@Injectable()
export class PagosRepository implements IPagosRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: CrearPagoData): Promise<Pago> {
    return this.prisma.pago.create({ data });
  }

  async buscarPorPedido(
    params: BuscarPagosPorPedidoParams,
  ): Promise<{ data: Pago[]; total: number }> {
    const where = { pedidoId: params.pedidoId };

    const [data, total] = await Promise.all([
      this.prisma.pago.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { creadoEn: 'desc' },
      }),
      this.prisma.pago.count({ where }),
    ]);

    return { data, total };
  }

  async sumarMontoPorPedido(pedidoId: bigint): Promise<number> {
    const resultado = await this.prisma.pago.aggregate({
      where: { pedidoId },
      _sum: { monto: true },
    });
    return resultado._sum.monto?.toNumber() ?? 0;
  }
}
