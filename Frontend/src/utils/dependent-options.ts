/**
 * Cachea la carga de opciones de un campo cuyo contenido depende del valor
 * de otro (ej. Sucursal depende de la Tienda elegida en el formulario de
 * Pedidos): si el usuario vuelve a elegir un valor de padre ya consultado,
 * reutiliza el resultado en vez de repetir la llamada al servicio. No
 * conoce Tiendas/Sucursales ni ningun otro modulo: recibe la funcion de
 * carga real (el servicio correspondiente) por parametro.
 *
 * Esta utilidad SOLO cachea — no decide si una respuesta en curso sigue
 * siendo relevante cuando el padre cambia varias veces seguidas (eso
 * depende del DOM/estado visible, que esta utilidad no conoce). Quien la
 * use debe protegerse contra respuestas obsoletas comparando, al resolver
 * la promesa, que el valor de padre siga siendo el vigente antes de
 * aplicar el resultado (ver `pedido-form.ts`).
 */
export function createDependentOptionsLoader<P extends string | number, O>(
  loadOptions: (parentValue: P) => Promise<O[]>,
) {
  const cache = new Map<P, O[]>();

  return {
    /** Devuelve las opciones para `parentValue`, o `[]` si aun no hay padre elegido. */
    async load(parentValue: P | undefined): Promise<O[]> {
      if (parentValue === undefined) return [];

      const cached = cache.get(parentValue);
      if (cached) return cached;

      const options = await loadOptions(parentValue);
      cache.set(parentValue, options);
      return options;
    },
  };
}
