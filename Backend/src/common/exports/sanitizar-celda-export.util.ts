const CARACTERES_PELIGROSOS = new Set(['=', '+', '-', '@', '\t', '\r']);

/**
 * Mitigacion estandar de OWASP para CSV/Excel Formula Injection (Fase 28,
 * correccion C3 de la auditoria): si un valor de celda es texto y su primer
 * caracter es uno de los que Excel/LibreOffice/Google Sheets interpretan
 * como inicio de formula (`=`, `+`, `-`, `@`, tab, retorno de carro), se le
 * antepone un apostrofe para forzar que se trate como texto literal. Los
 * valores `number` nunca se tocan (un numero negativo no es una formula).
 * Unico punto de saneamiento — reutilizado por `ExcelExporter` y
 * `CsvExporter`, nunca duplicado entre ellos.
 */
export function sanitizarCeldaExport(valor: string | number): string | number {
  if (typeof valor !== 'string' || valor.length === 0) return valor;
  return CARACTERES_PELIGROSOS.has(valor[0]) ? `'${valor}` : valor;
}
