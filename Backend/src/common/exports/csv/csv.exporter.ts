import { Injectable } from '@nestjs/common';
import { ExportArchivo, ExportSolicitud, IExportador } from '../export.types';
import { construirNombreArchivo } from '../export-filename.util';
import { sanitizarCeldaExport } from '../sanitizar-celda-export.util';

const SEPARADOR = ',';
const SALTO_LINEA = '\r\n';
const BOM_UTF8 = String.fromCharCode(0xfeff);

/** Escapa un valor segun RFC 4180: si contiene el separador, comillas o un salto de linea, se envuelve entre comillas dobles (duplicando las comillas internas). */
function escaparCampo(valor: string): string {
  if (
    valor.includes(SEPARADOR) ||
    valor.includes('"') ||
    /[\r\n]/.test(valor)
  ) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function fila(...campos: string[]): string {
  return campos.map(escaparCampo).join(SEPARADOR);
}

/**
 * Exportador a CSV (Fase 18): compatible con Excel (BOM UTF-8 + separador
 * estandar), con la misma metadata que el resto de los formatos antes de
 * la tabla de datos — nunca solo la tabla.
 */
@Injectable()
export class CsvExporter implements IExportador {
  exportar(solicitud: ExportSolicitud): ExportArchivo {
    const lineas: string[] = [];

    lineas.push(fila(solicitud.titulo));
    lineas.push(fila('Generado por', solicitud.generadoPor));
    lineas.push(
      fila('Fecha de generación', solicitud.generadoEn.toISOString()),
    );

    const filtrosTexto = Object.entries(solicitud.filtros)
      .map(([nombre, valor]) => `${nombre}=${valor}`)
      .join('; ');
    lineas.push(fila('Filtros aplicados', filtrosTexto || 'Ninguno'));
    lineas.push(fila('Total de registros', String(solicitud.filas.length)));
    lineas.push('');

    lineas.push(
      fila(...solicitud.columnas.map((columna) => columna.encabezado)),
    );
    for (const registro of solicitud.filas) {
      lineas.push(
        fila(
          ...solicitud.columnas.map((columna) =>
            String(sanitizarCeldaExport(registro[columna.clave] ?? '')),
          ),
        ),
      );
    }

    // Sin el BOM, Excel en Windows suele interpretar el archivo con la
    // codificacion regional en vez de UTF-8, rompiendo tildes/eñes.
    const contenido = BOM_UTF8 + lineas.join(SALTO_LINEA);

    return {
      buffer: Buffer.from(contenido, 'utf-8'),
      nombreArchivo: construirNombreArchivo(
        solicitud.titulo,
        'csv',
        solicitud.generadoEn,
      ),
      mimeType: 'text/csv; charset=utf-8',
    };
  }
}
