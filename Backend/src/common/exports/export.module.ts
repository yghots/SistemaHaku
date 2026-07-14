import { Module } from '@nestjs/common';
import { CsvExporter } from './csv/csv.exporter';
import { ExcelExporter } from './excel/excel.exporter';
import { ExportService } from './export.service';
import { JsonExporter } from './json/json.exporter';
import { PdfExporter } from './pdf/pdf.exporter';
import { XmlExporter } from './xml/xml.exporter';

/**
 * Modulo generico de exportacion (Fase 18) — vive en `common/` a
 * proposito, igual que `PrismaModule`: no pertenece a ningun dominio de
 * negocio particular. Cualquier modulo que necesite exportar un listado
 * (hoy `ReportesModule`) importa este modulo y solo depende de
 * `ExportService`, nunca de un exportador concreto.
 */
@Module({
  providers: [
    ExportService,
    ExcelExporter,
    PdfExporter,
    CsvExporter,
    JsonExporter,
    XmlExporter,
  ],
  exports: [ExportService],
})
export class ExportModule {}
