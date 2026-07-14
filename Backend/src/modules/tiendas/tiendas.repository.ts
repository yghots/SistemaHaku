import { Injectable } from '@nestjs/common';
import { Prisma, Tienda } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActualizarTiendaData,
  BuscarTiendasParams,
  CrearTiendaData,
  ITiendasRepository,
} from './interfaces/tiendas-repository.interface';

@Injectable()
export class TiendasRepository implements ITiendasRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: CrearTiendaData): Promise<Tienda> {
    return this.prisma.tienda.create({ data });
  }

  buscarPorId(id: bigint): Promise<Tienda | null> {
    return this.prisma.tienda.findFirst({ where: { id, deletedAt: null } });
  }

  // No filtra deletedAt: una tienda eliminada logicamente sigue bloqueando
  // su nombre/ruc para tiendas nuevas (decision aprobada en Fase 4).
  buscarPorNombre(nombre: string): Promise<Tienda | null> {
    return this.prisma.tienda.findFirst({ where: { nombre } });
  }

  buscarPorRuc(ruc: string): Promise<Tienda | null> {
    return this.prisma.tienda.findFirst({ where: { ruc } });
  }

  async buscarMuchos(
    params: BuscarTiendasParams,
  ): Promise<{ data: Tienda[]; total: number }> {
    const where: Prisma.TiendaWhereInput = {
      deletedAt: null,
      ...(params.nombre ? { nombre: { contains: params.nombre } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.tienda.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { id: 'asc' },
      }),
      this.prisma.tienda.count({ where }),
    ]);

    return { data, total };
  }

  actualizar(id: bigint, data: ActualizarTiendaData): Promise<Tienda> {
    return this.prisma.tienda.update({ where: { id }, data });
  }

  cambiarActivo(id: bigint, activo: boolean): Promise<Tienda> {
    return this.prisma.tienda.update({ where: { id }, data: { activo } });
  }

  eliminarLogicamente(id: bigint): Promise<Tienda> {
    return this.prisma.tienda.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
