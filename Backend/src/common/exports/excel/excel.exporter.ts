import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { ExportArchivo, ExportSolicitud, IExportador } from '../export.types';
import { construirNombreArchivo } from '../export-filename.util';

const ANCHO_MINIMO = 10;
const ANCHO_MAXIMO = 60;
const RELLENO = 2;

/**
 * Exportador a Excel (.xlsx) (Fase 18): encabezado + titulo + filtros +
 * tabla, con autoajuste aproximado de columnas (ExcelJS no tiene un
 * autofit real — Excel lo calcula al abrir el archivo — asi que se
 * estima el ancho segun el contenido mas largo de cada columna,
 * incluido su encabezado).
 */
@Injectable()
export class ExcelExporter implements IExportador {
  async exportar(solicitud: ExportSolicitud): Promise<ExportArchivo> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = solicitud.generadoPor;
    workbook.created = solicitud.generadoEn;

    const hoja = workbook.addWorksheet('Reporte');
    const totalColumnas = solicitud.columnas.length;

    hoja.mergeCells(1, 1, 1, Math.max(totalColumnas, 1));
    const celdaTitulo = hoja.getCell(1, 1);
    celdaTitulo.value = solicitud.titulo;
    celdaTitulo.font = { size: 16, bold: true };

    hoja.getCell(2, 1).value = `Generado por: ${solicitud.generadoPor}`;
    hoja.getCell(3, 1).value =
      `Fecha de generación: ${solicitud.generadoEn.toLocaleString('es')}`;

    const filtrosTexto = Object.entries(solicitud.filtros)
      .map(([nombre, valor]) => `${nombre}=${valor}`)
      .join('; ');
    hoja.getCell(4, 1).value =
      `Filtros aplicados: ${filtrosTexto || 'Ninguno'}`;
    hoja.getCell(5, 1).value = `Total de registros: ${solicitud.filas.length}`;

    const filaEncabezado = 7;
    solicitud.columnas.forEach((columna, index) => {
      const celda = hoja.getCell(filaEncabezado, index + 1);
      celda.value = columna.encabezado;
      celda.font = { bold: true };
      celda.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };
    });

    solicitud.filas.forEach((registro, filaIndex) => {
      solicitud.columnas.forEach((columna, columnaIndex) => {
        hoja.getCell(filaEncabezado + 1 + filaIndex, columnaIndex + 1).value =
          registro[columna.clave] ?? '';
      });
    });

    solicitud.columnas.forEach((columna, index) => {
      const valores = solicitud.filas.map((registro) =>
        String(registro[columna.clave] ?? ''),
      );
      const anchoContenido = Math.max(
        columna.encabezado.length,
        ...valores.map((v) => v.length),
      );
      hoja.getColumn(index + 1).width = Math.min(
        ANCHO_MAXIMO,
        Math.max(ANCHO_MINIMO, anchoContenido + RELLENO),
      );
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: Buffer.from(buffer),
      nombreArchivo: construirNombreArchivo(
        solicitud.titulo,
        'xlsx',
        solicitud.generadoEn,
      ),
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
}
