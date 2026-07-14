import { Injectable } from '@nestjs/common';
import { ExportArchivo, ExportSolicitud, IExportador } from '../export.types';
import { construirNombreArchivo } from '../export-filename.util';

/**
 * Exportador a JSON (Fase 18): pensado para integraciones. Misma
 * informacion que el resto de los formatos (titulo, metadata, filtros,
 * total, datos), nunca solo el arreglo de filas.
 */
@Injectable()
export class JsonExporter implements IExportador {
  exportar(solicitud: ExportSolicitud): ExportArchivo {
    const payload = {
      reporte: solicitud.titulo,
      generadoPor: solicitud.generadoPor,
      generadoEn: solicitud.generadoEn.toISOString(),
      filtros: solicitud.filtros,
      totalRegistros: solicitud.filas.length,
      datos: solicitud.filas,
    };

    return {
      buffer: Buffer.from(JSON.stringify(payload, null, 2), 'utf-8'),
      nombreArchivo: construirNombreArchivo(
        solicitud.titulo,
        'json',
        solicitud.generadoEn,
      ),
      mimeType: 'application/json; charset=utf-8',
    };
  }
}
