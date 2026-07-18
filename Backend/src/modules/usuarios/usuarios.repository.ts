import { Injectable } from '@nestjs/common';
import { Prisma, Usuario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ActualizarUsuarioData,
  BuscarUsuariosParams,
  CrearUsuarioData,
  IUsuariosRepository,
} from './interfaces/usuarios-repository.interface';

@Injectable()
export class UsuariosRepository implements IUsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: CrearUsuarioData): Promise<Usuario> {
    return this.prisma.usuario.create({ data });
  }

  buscarPorId(id: bigint): Promise<Usuario | null> {
    return this.prisma.usuario.findFirst({ where: { id, deletedAt: null } });
  }

  // No filtran deletedAt: un usuario eliminado logicamente sigue
  // bloqueando su nombre de usuario/correo para cuentas nuevas (mismo
  // criterio aprobado para Tiendas en Fase 4, ver tiendas.repository.ts).
  buscarPorUsuario(usuario: string): Promise<Usuario | null> {
    return this.prisma.usuario.findFirst({ where: { usuario } });
  }

  buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return this.prisma.usuario.findFirst({ where: { correo } });
  }

  buscarPorUsuarioOCorreo(identificador: string): Promise<Usuario | null> {
    return this.prisma.usuario.findFirst({
      where: { OR: [{ usuario: identificador }, { correo: identificador }] },
    });
  }

  async buscarMuchos(
    params: BuscarUsuariosParams,
  ): Promise<{ data: Usuario[]; total: number }> {
    const where: Prisma.UsuarioWhereInput = {
      deletedAt: null,
      ...(params.usuario ? { usuario: { contains: params.usuario } } : {}),
      ...(params.correo ? { correo: { contains: params.correo } } : {}),
      ...(params.rol ? { rol: params.rol } : {}),
      ...(params.activo !== undefined ? { activo: params.activo } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { id: 'asc' },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { data, total };
  }

  actualizar(id: bigint, data: ActualizarUsuarioData): Promise<Usuario> {
    return this.prisma.usuario.update({ where: { id }, data });
  }

  cambiarActivo(id: bigint, activo: boolean): Promise<Usuario> {
    return this.prisma.usuario.update({ where: { id }, data: { activo } });
  }

  eliminarLogicamente(id: bigint): Promise<Usuario> {
    return this.prisma.usuario.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async tienePerfilMotorizado(usuarioId: bigint): Promise<boolean> {
    const perfil = await this.prisma.perfilMotorizado.findUnique({
      where: { usuarioId },
      select: { id: true },
    });
    return perfil !== null;
  }

  async tieneHistorial(usuarioId: bigint): Promise<boolean> {
    const [
      pedidoCreado,
      eventoHistorial,
      pagoRegistrado,
      importacion,
      tienePerfil,
    ] = await Promise.all([
      this.prisma.pedido.findFirst({
        where: { creadoPorId: usuarioId },
        select: { id: true },
      }),
      this.prisma.historialPedido.findFirst({
        where: { usuarioId },
        select: { id: true },
      }),
      this.prisma.pago.findFirst({
        where: { creadoPorId: usuarioId },
        select: { id: true },
      }),
      this.prisma.importacionHistorial.findFirst({
        where: { usuarioId },
        select: { id: true },
      }),
      this.tienePerfilMotorizado(usuarioId),
    ]);
    return (
      pedidoCreado !== null ||
      eventoHistorial !== null ||
      pagoRegistrado !== null ||
      importacion !== null ||
      tienePerfil
    );
  }
}
