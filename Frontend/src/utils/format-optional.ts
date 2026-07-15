/**
 * Texto unico para representar cualquier campo opcional sin valor (Bugfix
 * de presentacion uniforme) — ningun componente debe volver a mostrar
 * "—", vacio, "null" o "undefined" cuando un dato no exista.
 */
export const SIN_VALOR_LABEL = 'No registrado';

/**
 * Unica utilidad para representar un campo de texto opcional. `null`,
 * `undefined` o `""` se muestran como `SIN_VALOR_LABEL`; si hay
 * informacion real, se devuelve exactamente igual, sin modificarla. Usar
 * siempre esta funcion en vez de escribir `valor ?? 'No registrado'`
 * repetido en cada componente.
 *
 * Cuando el valor "verdadero" se transforma antes de mostrarse (ej. un id
 * que se resuelve a una etiqueta con una funcion de lookup), este helper
 * no aplica directamente — en ese caso, reutilizar `SIN_VALOR_LABEL` como
 * la rama vacia del propio condicional, para mantener el mismo texto en
 * toda la aplicacion.
 */
export function formatOptional(value: string | null | undefined): string {
  return value === null || value === undefined || value === '' ? SIN_VALOR_LABEL : value;
}
