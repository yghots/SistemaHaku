import { Injectable } from '@nestjs/common';
import { CsvExporter } from './csv/csv.exporter';
import { ExcelExporter } from './excel/excel.exporter';
import {
  ExportArchivo,
  ExportSolicitud,
  FormatoExportacion,
} from './export.types';
import { JsonExporter } from './json/json.exporter';
import { PdfExporter } from './pdf/pdf.exporter';
import { XmlExporter } from './xml/xml.exporter';

/**
 * Unico punto de entrada de la infraestructura de exportacion (Fase 18).
 * Cualquier modulo del sistema que necesite exportar un listado (hoy
 * Reportes, mañana cualquier otro) depende solo de este servicio — nunca
 * de un exportador concreto directamente. Agregar un futuro formato es
 * agregar un caso aqui y su propia clase `IExportador`, sin tocar a
 * quienes ya consumen `ExportService`.
 */
@Injectable()
export class ExportService {
  constructor(
    private readonly excelExporter: ExcelExporter,
    private readonly pdfExporter: PdfExporter,
    private readonly csvExporter: CsvExporter,
    private readonly jsonExporter: JsonExporter,
    private readonly xmlExporter: XmlExporter,
  ) {}

  async exportar(
    formato: FormatoExportacion,
    solicitud: ExportSolicitud,
  ): Promise<ExportArchivo> {
    switch (formato) {
      case 'xlsx':
        return this.excelExporter.exportar(solicitud);
      case 'pdf':
        return this.pdfExporter.exportar(solicitud);
      case 'csv':
        return this.csvExporter.exportar(solicitud);
      case 'json':
        return this.jsonExporter.exportar(solicitud);
      case 'xml':
        return this.xmlExporter.exportar(solicitud);
    }
  }
}
