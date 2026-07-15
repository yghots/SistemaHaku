export type EstadoResultadoFila = 'importado' | 'duplicado' | 'invalido';

export interface ResultadoFilaImportador {
  estado: EstadoResultadoFila;
  motivo?: string;
  campo?: string;
  valor?: string;
}

/**
 * Contrato que toda entidad importable debe implementar. `columnas` es el
 * orden esperado de encabezados (usado por el lector para nombrar columnas
 * de xlsx y como referencia de las plantillas oficiales). `procesarFila` es
 * el unico metodo: valida + detecta duplicados siempre, y solo escribe en
 * la base de datos cuando `dryRun` es `false` — asi "analizar" (vista
 * previa) y "confirmar" comparten exactamente la misma logica de
 * validacion y deteccion de duplicados, sin duplicarla en dos metodos.
 */
export interface IEntidadImportador {
  readonly columnas: string[];
  procesarFila(
    fila: Record<string, string>,
    dryRun: boolean,
  ): Promise<ResultadoFilaImportador>;
}
