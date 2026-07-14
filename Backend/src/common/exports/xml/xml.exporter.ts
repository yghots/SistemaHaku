import { Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import { ExportArchivo, ExportSolicitud, IExportador } from '../export.types';
import { construirNombreArchivo } from '../export-filename.util';

/** Convierte una `clave` de columna en un nombre de elemento XML valido (por si alguna vez incluye caracteres fuera de a-z/0-9/_). */
function nombreElementoValido(clave: string): string {
  const normalizado = clave.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[a-zA-Z_]/.test(normalizado) ? normalizado : `_${normalizado}`;
}

/**
 * Exportador a XML (Fase 18): estructura jerarquica clara, pensada para
 * integraciones empresariales. `xmlbuilder2` se encarga del escapado y de
 * producir XML valido — este exportador no concatena strings a mano.
 */
@Injectable()
export class XmlExporter implements IExportador {
  exportar(solicitud: ExportSolicitud): ExportArchivo {
    const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('reporte', {
      nombre: solicitud.titulo,
    });

    const metadata = root.ele('metadata');
    metadata.ele('generadoPor').txt(solicitud.generadoPor);
    metadata.ele('generadoEn').txt(solicitud.generadoEn.toISOString());
    metadata.ele('totalRegistros').txt(String(solicitud.filas.length));

    const filtrosEl = metadata.ele('filtros');
    for (const [nombre, valor] of Object.entries(solicitud.filtros)) {
      filtrosEl.ele('filtro', { nombre }).txt(valor);
    }

    const datosEl = root.ele('datos');
    for (const fila of solicitud.filas) {
      const registroEl = datosEl.ele('registro');
      for (const columna of solicitud.columnas) {
        registroEl
          .ele(nombreElementoValido(columna.clave))
          .txt(String(fila[columna.clave] ?? ''));
      }
    }

    const xml = root.end({ prettyPrint: true });

    return {
      buffer: Buffer.from(xml, 'utf-8'),
      nombreArchivo: construirNombreArchivo(
        solicitud.titulo,
        'xml',
        solicitud.generadoEn,
      ),
      mimeType: 'application/xml; charset=utf-8',
    };
  }
}
