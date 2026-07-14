import { Injectable } from '@nestjs/common';
import { PerfilMotorizado, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActualizarPerfilMotorizadoData,
  BuscarPerfilesMotorizadosParams,
  CrearPerfilMotorizadoData,
  IPerfilesMotorizadosRepository,
} from './interfaces/perfiles-motorizados-repository.interface';

@Injectable()
export class PerfilesMotorizadosRepository implements IPerfilesMotorizadosRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: CrearPerfilMotorizadoData): Promise<PerfilMotorizado> {
    return this.prisma.perfilMotorizado.create({ data });
  }

  buscarPorId(id: bigint): Promise<PerfilMotorizado | null> {
    return this.prisma.perfilMotorizado.findUnique({ where: { id } });
  }

  buscarPorUsuarioId(usuarioId: bigint): Promise<PerfilMotorizado | null> {
    return this.prisma.perfilMotorizado.findUnique({ where: { usuarioId } });
  }

  async buscarMuchos(
    params: BuscarPerfilesMotorizadosParams,
  ): Promise<{ data: PerfilMotorizado[]; total: number }> {
    const where: Prisma.PerfilMotorizadoWhereInput = {
      ...(params.usuarioId ? { usuarioId: params.usuarioId } : {}),
      ...(params.estado ? { estado: params.estado } : {}),
      ...(params.placa ? { placa: { contains: params.placa } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.perfilMotorizado.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { id: 'asc' },
      }),
      this.prisma.perfilMotorizado.count({ where }),
    ]);

    return { data, total };
  }

  actualizar(
    id: bigint,
    data: ActualizarPerfilMotorizadoData,
  ): Promise<PerfilMotorizado> {
    return this.prisma.perfilMotorizado.update({ where: { id }, data });
  }

  eliminar(id: bigint): Promise<PerfilMotorizado> {
    return this.prisma.perfilMotorizado.delete({ where: { id } });
  }
}
