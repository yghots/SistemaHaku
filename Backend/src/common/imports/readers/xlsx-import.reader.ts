import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { FilaCruda, ILectorImportacion } from '../import.types';

/** Convierte cualquier valor de celda de ExcelJS a texto plano (numeros, fechas, texto enriquecido, hipervinculos). */
function celdaATexto(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) return '';
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === 'object') {
    if ('text' in valor) return String(valor.text ?? '');
    if ('richText' in valor)
      return valor.richText.map((parte) => parte.text).join('');
    return '';
  }
  return String(valor).trim();
}

/**
 * Lector de xlsx: primera hoja, primera fila = encabezados (nombres de
 * columna), el resto = filas de datos. Filas completamente vacias se
 * omiten. No conoce ninguna entidad — solo produce `FilaCruda[]`.
 */
@Injectable()
export class XlsxImportReader implements ILectorImportacion {
  async leer(buffer: Buffer): Promise<FilaCruda[]> {
    const workbook = new ExcelJS.Workbook();
    // exceljs declara su propio tipo `Buffer` (shim que extiende
    // ArrayBuffer) en vez de usar el de @types/node — incompatible en modo
    // estricto con el Buffer real de Node sin importar la conversion; `any`
    // es la unica salida practica para este choque de tipos de un tercero
    // (no afecta el tipo de retorno de `leer`, que sigue siendo `FilaCruda[]`).
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await workbook.xlsx.load(buffer as any);
    const hoja = workbook.worksheets[0];
    if (!hoja) return [];

    const encabezados: string[] = [];
    hoja.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumero) => {
      encabezados[colNumero] = celdaATexto(cell.value);
    });

    const filas: FilaCruda[] = [];
    hoja.eachRow((row, numeroFila) => {
      if (numeroFila === 1) return;

      const fila: FilaCruda = {};
      let tieneContenido = false;
      row.eachCell({ includeEmpty: true }, (cell, colNumero) => {
        const encabezado = encabezados[colNumero];
        if (!encabezado) return;
        const valor = celdaATexto(cell.value);
        if (valor) tieneContenido = true;
        fila[encabezado] = valor;
      });

      if (tieneContenido) filas.push(fila);
    });

    return filas;
  }
}
