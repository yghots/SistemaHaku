import type { SelectOption } from '../components/select/select';

/**
 * Convierte una lista de entidades reales del backend en opciones de
 * `Select`, evitando repetir el mismo `.map` en cada modulo que puebla un
 * selector con datos reales (ej. tiendas para Sucursales, usuarios para
 * Motorizados, y clientes/motorizados para Pedidos en una fase futura).
 */
export function toSelectOptions<T>(
  items: T[],
  getValue: (item: T) => string,
  getLabel: (item: T) => string,
): SelectOption[] {
  return items.map((item) => ({ value: getValue(item), label: getLabel(item) }));
}
