import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BuscarHistorialParams,
  CrearHistorialData,
  IImportacionesRepository,
  ImportacionHistorialConDetalle,
  ImportacionHistorialConUsuario,
} from './interfaces/importaciones-repository.interface';

const INCLUDE_USUARIO = {
  usuario: { select: { nombres: true, apellidos: true } },
} satisfies Prisma.ImportacionHistorialInclude;

@Injectable()
export class ImportacionesRepository implements IImportacionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  crearHistorial(
    data: CrearHistorialData,
  ): Promise<ImportacionHistorialConUsuario> {
    return this.prisma.importacionHistorial.create({
      data: {
        entidad: data.entidad,
        archivoNombre: data.archivoNombre,
        formato: data.formato,
        usuarioId: data.usuarioId,
        totalEncontrados: data.totalEncontrados,
        importados: data.importados,
        duplicados: data.duplicados,
        errores: data.errores,
        tiempoProcesamientoMs: data.tiempoProcesamientoMs,
        estado: data.estado,
        detalles: {
          create: data.detalles.map((detalle) => ({
            fila: detalle.fila,
            estado: detalle.estado,
            motivo: detalle.motivo,
            campo: detalle.campo,
            valor: detalle.valor,
          })),
        },
      },
      include: INCLUDE_USUARIO,
    });
  }

  buscarHistorialPorId(
    id: bigint,
  ): Promise<ImportacionHistorialConDetalle | null> {
    return this.prisma.importacionHistorial.findUnique({
      where: { id },
      include: {
        ...INCLUDE_USUARIO,
        detalles: { orderBy: { fila: 'asc' } },
      },
    });
  }

  async buscarMuchoHistorial(
    params: BuscarHistorialParams,
  ): Promise<{ data: ImportacionHistorialConUsuario[]; total: number }> {
    const where: Prisma.ImportacionHistorialWhereInput = {
      ...(params.entidad ? { entidad: params.entidad } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.importacionHistorial.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { creadoEn: 'desc' },
        include: INCLUDE_USUARIO,
      }),
      this.prisma.importacionHistorial.count({ where }),
    ]);

    return { data, total };
  }
}
