import type { PaginatedResponse } from '../types/api';

/**
 * Recorre un endpoint paginado existente hasta reunir todos sus
 * resultados. Usarla unicamente cuando no exista un filtro de backend
 * equivalente al que se necesita (ej. "pedidos asignados a mi", ya que
 * `GET /pedidos` no admite filtrar por `motorizadoActualId`) y el
 * resultado final deba filtrarse/paginarse en el cliente. No inventa un
 * endpoint nuevo: solo repite llamadas al mismo `fetchPage` ya existente.
 */
export async function fetchAllPages<T>(
  fetchPage: (params: { page: number; limit: number }) => Promise<PaginatedResponse<T>>,
  pageSize = 100,
): Promise<T[]> {
  const first = await fetchPage({ page: 1, limit: pageSize });
  const items = [...first.data];

  const totalPages = Math.ceil(first.total / pageSize);
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchPage({ page, limit: pageSize });
    items.push(...next.data);
  }

  return items;
}
