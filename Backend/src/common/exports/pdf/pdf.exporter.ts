import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { ExportArchivo, ExportSolicitud, IExportador } from '../export.types';
import { construirNombreArchivo } from '../export-filename.util';

const MARGEN = 40;
const ALTO_FILA = 20;
const TAMANO_FUENTE_TABLA = 8;

/**
 * Exportador a PDF (Fase 18): encabezado + titulo + filtros + fecha +
 * tabla con salto de pagina automatico + numeracion de paginas. `pdfkit`
 * no trae una tabla integrada — se dibuja manualmente (posiciones de
 * columna proporcionales al ancho disponible), tecnica estandar con esta
 * libreria.
 */
@Injectable()
export class PdfExporter implements IExportador {
  exportar(solicitud: ExportSolicitud): Promise<ExportArchivo> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: MARGEN,
        size: 'A4',
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('error', reject);
      doc.on('end', () => {
        this.numerarPaginas(doc);
        resolve({
          buffer: Buffer.concat(chunks),
          nombreArchivo: construirNombreArchivo(
            solicitud.titulo,
            'pdf',
            solicitud.generadoEn,
          ),
          mimeType: 'application/pdf',
        });
      });

      this.dibujarEncabezado(doc, solicitud);
      const anchosColumna = this.calcularAnchosColumna(doc, solicitud);
      this.dibujarTabla(doc, solicitud, anchosColumna);

      doc.end();
    });
  }

  private dibujarEncabezado(
    doc: PDFKit.PDFDocument,
    solicitud: ExportSolicitud,
  ): void {
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(solicitud.titulo, { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica');
    doc.text(`Generado por: ${solicitud.generadoPor}`);
    doc.text(
      `Fecha de generación: ${solicitud.generadoEn.toLocaleString('es')}`,
    );

    const filtrosTexto = Object.entries(solicitud.filtros)
      .map(([nombre, valor]) => `${nombre}=${valor}`)
      .join('; ');
    doc.text(`Filtros aplicados: ${filtrosTexto || 'Ninguno'}`);
    doc.text(`Total de registros: ${solicitud.filas.length}`);
    doc.moveDown(1);
  }

  private calcularAnchosColumna(
    doc: PDFKit.PDFDocument,
    solicitud: ExportSolicitud,
  ): number[] {
    const anchoDisponible = doc.page.width - MARGEN * 2;
    const cantidad = Math.max(solicitud.columnas.length, 1);
    // Reparto proporcional simple (mismo ancho para todas las columnas):
    // suficiente para un reporte tabular generico sin conocer el dominio.
    return solicitud.columnas.map(() => anchoDisponible / cantidad);
  }

  private dibujarFilaEncabezado(
    doc: PDFKit.PDFDocument,
    solicitud: ExportSolicitud,
    anchosColumna: number[],
    y: number,
  ): void {
    doc.font('Helvetica-Bold').fontSize(TAMANO_FUENTE_TABLA);
    let x = MARGEN;
    solicitud.columnas.forEach((columna, index) => {
      doc.text(columna.encabezado, x, y, {
        width: anchosColumna[index],
        ellipsis: true,
      });
      x += anchosColumna[index];
    });
    doc
      .moveTo(MARGEN, y + ALTO_FILA - 4)
      .lineTo(doc.page.width - MARGEN, y + ALTO_FILA - 4)
      .stroke();
  }

  private dibujarTabla(
    doc: PDFKit.PDFDocument,
    solicitud: ExportSolicitud,
    anchosColumna: number[],
  ): void {
    const limiteInferior = doc.page.height - MARGEN;
    let y = doc.y;

    this.dibujarFilaEncabezado(doc, solicitud, anchosColumna, y);
    y += ALTO_FILA;

    doc.font('Helvetica').fontSize(TAMANO_FUENTE_TABLA);
    for (const registro of solicitud.filas) {
      if (y + ALTO_FILA > limiteInferior) {
        doc.addPage();
        y = MARGEN;
        this.dibujarFilaEncabezado(doc, solicitud, anchosColumna, y);
        y += ALTO_FILA;
        doc.font('Helvetica').fontSize(TAMANO_FUENTE_TABLA);
      }

      let x = MARGEN;
      solicitud.columnas.forEach((columna, index) => {
        const valor = String(registro[columna.clave] ?? '');
        doc.text(valor, x, y, { width: anchosColumna[index], ellipsis: true });
        x += anchosColumna[index];
      });
      y += ALTO_FILA;
    }
  }

  /** `bufferPages: true` permite recorrer todas las paginas ya generadas al final, unica forma de numerarlas sin saber de antemano cuantas habra. */
  private numerarPaginas(doc: PDFKit.PDFDocument): void {
    const rango = doc.bufferedPageRange();
    for (let i = rango.start; i < rango.start + rango.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Página ${i + 1} de ${rango.count}`,
          MARGEN,
          doc.page.height - MARGEN + 10,
          {
            width: doc.page.width - MARGEN * 2,
            align: 'center',
          },
        );
    }
  }
}
