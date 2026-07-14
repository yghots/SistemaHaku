/** Contrato comun de todo layout: la raiz para insertar en #app, y el punto donde el router monta cada pagina. */
export interface LayoutHandle {
  element: HTMLElement;
  mount: HTMLElement;
}
