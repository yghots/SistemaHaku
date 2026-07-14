export interface PaginaSolicitud {
  skip: number;
  take: number;
}

export interface PaginaResultado<T> {
  data: T[];
  total: number;
}

const TAMANO_PAGINA = 100;

/**
 * Recorre un metodo de repositorio ya paginado (`skip`/`take`) hasta
 * reunir todas las filas que coinciden con el filtro vigente — usado
 * exclusivamente por la exportacion de reportes (Fase 18), que necesita
 * el conjunto completo, no solo una pagina. Reutiliza el MISMO metodo de
 * repositorio (la misma consulta Prisma) que ya usa el endpoint visual
 * paginado — nunca construye una consulta distinta. Analogo al
 * `fetchAllPages` que ya existe en el frontend (`src/utils/fetch-all-pages.ts`)
 * para el mismo proposito del lado del cliente.
 */
export async function fetchAllPages<T>(
  fetchPage: (pagina: PaginaSolicitud) => Promise<PaginaResultado<T>>,
  pageSize = TAMANO_PAGINA,
): Promise<T[]> {
  const resultados: T[] = [];
  let skip = 0;

  for (;;) {
    const { data, total } = await fetchPage({ skip, take: pageSize });
    resultados.push(...data);
    skip += pageSize;
    if (data.length === 0 || skip >= total) break;
  }

  return resultados;
}
