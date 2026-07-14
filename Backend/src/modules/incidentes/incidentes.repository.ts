import { Injectable } from '@nestjs/common';
import { Incidente, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BuscarIncidentesParams,
  CrearIncidenteData,
  IIncidentesRepository,
} from './interfaces/incidentes-repository.interface';

@Injectable()
export class IncidentesRepository implements IIncidentesRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: CrearIncidenteData): Promise<Incidente> {
    return this.prisma.incidente.create({ data });
  }

  buscarPorId(id: bigint): Promise<Incidente | null> {
    return this.prisma.incidente.findUnique({ where: { id } });
  }

  async buscarMuchos(
    params: BuscarIncidentesParams,
  ): Promise<{ data: Incidente[]; total: number }> {
    const where: Prisma.IncidenteWhereInput = {
      ...(params.pedidoId ? { pedidoId: params.pedidoId } : {}),
      ...(params.motorizadoId ? { motorizadoId: params.motorizadoId } : {}),
      ...(params.tipo ? { tipo: params.tipo } : {}),
      ...(params.resuelto !== undefined ? { resuelto: params.resuelto } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.incidente.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { id: 'asc' },
      }),
      this.prisma.incidente.count({ where }),
    ]);

    return { data, total };
  }
}
