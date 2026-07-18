import { BadRequestException } from '@nestjs/common';

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
 *
 * `limiteMaximo` (Fase 28, correccion C1 de la auditoria): si el `total`
 * real de filas que coinciden con el filtro supera este valor, se aborta
 * de inmediato con un 400 — antes de acumular una sola fila adicional, y
 * antes de que cualquier exportador (Excel/PDF/CSV/JSON/XML) reciba datos
 * y empiece a generar el archivo. Sin limite (parametro omitido) el
 * comportamiento es identico al de antes de esta correccion.
 */
export async function fetchAllPages<T>(
  fetchPage: (pagina: PaginaSolicitud) => Promise<PaginaResultado<T>>,
  pageSize = TAMANO_PAGINA,
  limiteMaximo?: number,
): Promise<T[]> {
  const resultados: T[] = [];
  let skip = 0;

  for (;;) {
    const { data, total } = await fetchPage({ skip, take: pageSize });

    if (limiteMaximo !== undefined && total > limiteMaximo) {
      throw new BadRequestException(
        `La exportación tiene ${total} registros, que supera el máximo permitido de ${limiteMaximo}. Acota el rango de fechas o aplica más filtros para reducir el resultado.`,
      );
    }

    resultados.push(...data);
    skip += pageSize;
    if (data.length === 0 || skip >= total) break;
  }

  return resultados;
}
