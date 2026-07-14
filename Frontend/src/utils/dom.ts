type ElAttrs = Record<string, unknown> & {
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  dataset?: Record<string, string>;
};

type ElChild = Node | string | number | false | null | undefined;

/**
 * Helper minimo para crear elementos DOM sin escribir document.createElement
 * + asignaciones repetidas en cada componente. No es un motor de templates:
 * solo azucar sintactico sobre la API nativa del DOM.
 *
 * Reglas de `attrs`:
 * - `className`, `style`, `dataset`: casos especiales (ver abajo).
 * - claves con guion (`aria-*`, `role` incluido si se prefiere explicito):
 *   se aplican con `setAttribute`, para no depender de que el navegador
 *   refleje esa propiedad ARIA como IDL property.
 * - el resto: asignacion de propiedad directa (sirve para `type`,
 *   `disabled`, `value`, `checked`, `onclick`, etc., que son propiedades
 *   IDL estandar del elemento).
 *
 *   el('button', { className: 'px-4 py-2', onclick: handler }, 'Guardar')
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: ElAttrs,
  ...children: ElChild[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (attrs) {
    const { className, style, dataset, ...rest } = attrs;
    if (className) element.className = className;
    if (style) Object.assign(element.style, style);
    if (dataset) Object.assign(element.dataset, dataset);

    // Los valores que llegan aqui son siempre primitivos (string/number/
    // boolean) o manejadores de evento en el uso real de este helper; se
    // mantiene el tipo generico Record<string, unknown> para no atar `el()`
    // a una lista cerrada de atributos/propiedades del DOM.
    for (const [key, value] of Object.entries(rest)) {
      if (value === undefined || value === null || value === false) continue;
      if (key.includes('-') || key === 'role') {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        element.setAttribute(key, String(value));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (element as any)[key] = value;
      }
    }
  }

  appendChildren(element, children);

  return element;
}

/** Agrega hijos (nodos, strings o valores falsy que se ignoran) a un elemento. */
export function appendChildren(parent: Node, children: ElChild[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** Limpia todos los hijos de un elemento antes de volver a renderizar. */
export function clearChildren(parent: Element): void {
  parent.replaceChildren();
}
