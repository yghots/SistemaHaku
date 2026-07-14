import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActualizarPerfilMotorizadoData,
  BuscarPerfilesMotorizadosParams,
  CrearPerfilMotorizadoData,
  IPerfilesMotorizadosRepository,
  PerfilMotorizadoConUsuario,
} from './interfaces/perfiles-motorizados-repository.interface';

// Fase 17: unica fuente de verdad del `include` que trae nombres/apellidos
// del Usuario asociado — reutilizado por todas las consultas de este
// repositorio para no repetirlo en cada metodo.
const INCLUDE_USUARIO = {
  usuario: { select: { nombres: true, apellidos: true } },
} satisfies Prisma.PerfilMotorizadoInclude;

@Injectable()
export class PerfilesMotorizadosRepository implements IPerfilesMotorizadosRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: CrearPerfilMotorizadoData): Promise<PerfilMotorizadoConUsuario> {
    return this.prisma.perfilMotorizado.create({
      data,
      include: INCLUDE_USUARIO,
    });
  }

  buscarPorId(id: bigint): Promise<PerfilMotorizadoConUsuario | null> {
    return this.prisma.perfilMotorizado.findUnique({
      where: { id },
      include: INCLUDE_USUARIO,
    });
  }

  buscarPorUsuarioId(
    usuarioId: bigint,
  ): Promise<PerfilMotorizadoConUsuario | null> {
    return this.prisma.perfilMotorizado.findUnique({
      where: { usuarioId },
      include: INCLUDE_USUARIO,
    });
  }

  async buscarMuchos(
    params: BuscarPerfilesMotorizadosParams,
  ): Promise<{ data: PerfilMotorizadoConUsuario[]; total: number }> {
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
        include: INCLUDE_USUARIO,
      }),
      this.prisma.perfilMotorizado.count({ where }),
    ]);

    return { data, total };
  }

  actualizar(
    id: bigint,
    data: ActualizarPerfilMotorizadoData,
  ): Promise<PerfilMotorizadoConUsuario> {
    return this.prisma.perfilMotorizado.update({
      where: { id },
      data,
      include: INCLUDE_USUARIO,
    });
  }

  eliminar(id: bigint): Promise<PerfilMotorizadoConUsuario> {
    return this.prisma.perfilMotorizado.delete({
      where: { id },
      include: INCLUDE_USUARIO,
    });
  }
}
