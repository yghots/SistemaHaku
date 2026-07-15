import { Injectable } from '@nestjs/common';
import type { FilaCruda, FormatoImportacion } from './import.types';
import { JsonImportReader } from './readers/json-import.reader';
import { XlsxImportReader } from './readers/xlsx-import.reader';
import { XmlImportReader } from './readers/xml-import.reader';

/**
 * Unico punto de despacho entre los 3 lectores de formato — agnostico de
 * entidad. Cualquier modulo que necesite leer un archivo de importacion
 * (hoy solo `ImportacionesModule`, preparado para futuras entidades) usa
 * este servicio en vez de instanciar un lector directamente.
 */
@Injectable()
export class ImportReaderService {
  constructor(
    private readonly xlsxReader: XlsxImportReader,
    private readonly jsonReader: JsonImportReader,
    private readonly xmlReader: XmlImportReader,
  ) {}

  async leer(
    formato: FormatoImportacion,
    buffer: Buffer,
  ): Promise<FilaCruda[]> {
    switch (formato) {
      case 'xlsx':
        return this.xlsxReader.leer(buffer);
      case 'json':
        return this.jsonReader.leer(buffer);
      case 'xml':
        return this.xmlReader.leer(buffer);
    }
  }
}
