import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Pedido, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActualizarPedidoData,
  BuscarPedidosParams,
  CrearPedidoData,
  IPedidosRepository,
} from './interfaces/pedidos-repository.interface';

@Injectable()
export class PedidosRepository implements IPedidosRepository {
  constructor(private readonly prisma: PrismaService) {}

  // codigoPedido = id.toString() (decision aprobada en Fase 7). El id
  // autoincremental no se conoce antes del insert, asi que se crea el
  // registro con un valor transitorio (nunca expuesto) que solo existe
  // para satisfacer la columna NOT NULL/UNIQUE durante la transaccion, y
  // se corrige en el mismo $transaction al valor final. Ver
  // DEVELOPMENT_PROGRESS.md (Fase 7) para el detalle de esta decision.
  async crear(data: CrearPedidoData): Promise<Pedido> {
    return this.prisma.$transaction(async (tx) => {
      const codigoPedidoTemporal = `tmp_${randomBytes(10).toString('hex')}`;

      const creado = await tx.pedido.create({
        data: { ...data, codigoPedido: codigoPedidoTemporal },
      });

      return tx.pedido.update({
        where: { id: creado.id },
        data: { codigoPedido: creado.id.toString() },
      });
    });
  }

  buscarPorId(id: bigint): Promise<Pedido | null> {
    return this.prisma.pedido.findUnique({ where: { id } });
  }

  async buscarMuchos(
    params: BuscarPedidosParams,
  ): Promise<{ data: Pedido[]; total: number }> {
    const where: Prisma.PedidoWhereInput = {
      ...(params.codigoPedido
        ? { codigoPedido: { contains: params.codigoPedido } }
        : {}),
      ...(params.clienteId ? { clienteId: params.clienteId } : {}),
      ...(params.sucursalId ? { sucursalId: params.sucursalId } : {}),
      ...(params.estado ? { estado: params.estado } : {}),
      ...(params.fechaDesde || params.fechaHasta
        ? {
            creadoEn: {
              ...(params.fechaDesde ? { gte: params.fechaDesde } : {}),
              ...(params.fechaHasta ? { lte: params.fechaHasta } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { id: 'asc' },
      }),
      this.prisma.pedido.count({ where }),
    ]);

    return { data, total };
  }

  actualizar(id: bigint, data: ActualizarPedidoData): Promise<Pedido> {
    return this.prisma.pedido.update({ where: { id }, data });
  }

  eliminar(id: bigint): Promise<Pedido> {
    return this.prisma.pedido.delete({ where: { id } });
  }

  async sumarMontoPagadoPorPedidos(
    pedidoIds: bigint[],
  ): Promise<Map<string, number>> {
    if (pedidoIds.length === 0) return new Map();

    const grupos = await this.prisma.pago.groupBy({
      by: ['pedidoId'],
      where: { pedidoId: { in: pedidoIds } },
      _sum: { monto: true },
    });

    return new Map(
      grupos.map((grupo) => [
        grupo.pedidoId.toString(),
        grupo._sum.monto?.toNumber() ?? 0,
      ]),
    );
  }
}
