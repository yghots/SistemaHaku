import { Module } from '@nestjs/common';
import { ImportReaderService } from './import-reader.service';
import { JsonImportReader } from './readers/json-import.reader';
import { XlsxImportReader } from './readers/xlsx-import.reader';
import { XmlImportReader } from './readers/xml-import.reader';

@Module({
  providers: [
    ImportReaderService,
    XlsxImportReader,
    JsonImportReader,
    XmlImportReader,
  ],
  exports: [ImportReaderService],
})
export class ImportModule {}
