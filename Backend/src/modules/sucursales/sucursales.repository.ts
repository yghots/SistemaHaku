import { Injectable } from '@nestjs/common';
import { Prisma, Sucursal } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActualizarSucursalData,
  BuscarSucursalesParams,
  CrearSucursalData,
  ISucursalesRepository,
} from './interfaces/sucursales-repository.interface';

@Injectable()
export class SucursalesRepository implements ISucursalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: CrearSucursalData): Promise<Sucursal> {
    return this.prisma.sucursal.create({ data });
  }

  buscarPorId(id: bigint): Promise<Sucursal | null> {
    return this.prisma.sucursal.findFirst({ where: { id, deletedAt: null } });
  }

  async buscarMuchos(
    params: BuscarSucursalesParams,
  ): Promise<{ data: Sucursal[]; total: number }> {
    const where: Prisma.SucursalWhereInput = {
      deletedAt: null,
      ...(params.tiendaId ? { tiendaId: params.tiendaId } : {}),
      ...(params.nombre ? { nombre: { contains: params.nombre } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.sucursal.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { id: 'asc' },
      }),
      this.prisma.sucursal.count({ where }),
    ]);

    return { data, total };
  }

  actualizar(id: bigint, data: ActualizarSucursalData): Promise<Sucursal> {
    return this.prisma.sucursal.update({ where: { id }, data });
  }

  eliminarLogicamente(id: bigint): Promise<Sucursal> {
    return this.prisma.sucursal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
