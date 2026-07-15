import {
  ImportacionHistorialConDetalle,
  ImportacionHistorialConUsuario,
} from './interfaces/importaciones-repository.interface';
import { ImportacionHistorialDetalleDto } from './dto/importacion-historial-detalle.dto';
import { ImportacionHistorialItemDto } from './dto/importacion-historial-item.dto';
import { ResultadoFilaDto } from './dto/resultado-fila.dto';

export class ImportacionesMapper {
  static toHistorialItemDto(
    historial: ImportacionHistorialConUsuario,
  ): ImportacionHistorialItemDto {
    return {
      id: historial.id.toString(),
      entidad: historial.entidad,
      archivoNombre: historial.archivoNombre,
      formato: historial.formato,
      usuarioId: historial.usuarioId.toString(),
      usuarioNombre:
        `${historial.usuario.nombres} ${historial.usuario.apellidos}`.trim(),
      totalEncontrados: historial.totalEncontrados,
      importados: historial.importados,
      duplicados: historial.duplicados,
      errores: historial.errores,
      tiempoProcesamientoMs: historial.tiempoProcesamientoMs,
      estado: historial.estado,
      creadoEn: historial.creadoEn,
    };
  }

  static toHistorialItemDtoList(
    historiales: ImportacionHistorialConUsuario[],
  ): ImportacionHistorialItemDto[] {
    return historiales.map((historial) => this.toHistorialItemDto(historial));
  }

  static toHistorialDetalleDto(
    historial: ImportacionHistorialConDetalle,
  ): ImportacionHistorialDetalleDto {
    return {
      ...this.toHistorialItemDto(historial),
      filas: historial.detalles.map((detalle): ResultadoFilaDto => ({
        fila: detalle.fila,
        estado: detalle.estado,
        motivo: detalle.motivo,
        campo: detalle.campo ?? undefined,
        valor: detalle.valor ?? undefined,
      })),
    };
  }
}
