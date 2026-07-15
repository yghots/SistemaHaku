import { Injectable } from '@nestjs/common';
import { Cliente, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActualizarClienteData,
  BuscarClientesParams,
  CrearClienteData,
  IClientesRepository,
} from './interfaces/clientes-repository.interface';

@Injectable()
export class ClientesRepository implements IClientesRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: CrearClienteData): Promise<Cliente> {
    return this.prisma.cliente.create({ data });
  }

  buscarPorId(id: bigint): Promise<Cliente | null> {
    return this.prisma.cliente.findFirst({ where: { id, deletedAt: null } });
  }

  buscarPorDocumentoIdentidad(
    documentoIdentidad: string,
  ): Promise<Cliente | null> {
    return this.prisma.cliente.findFirst({
      where: { documentoIdentidad, deletedAt: null },
    });
  }

  async buscarMuchos(
    params: BuscarClientesParams,
  ): Promise<{ data: Cliente[]; total: number }> {
    const where: Prisma.ClienteWhereInput = {
      deletedAt: null,
      ...(params.nombre ? { nombreCompleto: { contains: params.nombre } } : {}),
      ...(params.telefono ? { telefono: { contains: params.telefono } } : {}),
      ...(params.documentoIdentidad
        ? { documentoIdentidad: { contains: params.documentoIdentidad } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { id: 'asc' },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return { data, total };
  }

  actualizar(id: bigint, data: ActualizarClienteData): Promise<Cliente> {
    return this.prisma.cliente.update({ where: { id }, data });
  }

  eliminarLogicamente(id: bigint): Promise<Cliente> {
    return this.prisma.cliente.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
