export type RouteParams = Record<string, string>;

export interface RouteBreadcrumbItem {
  label: string;
  href?: string;
}

export interface RouteMeta {
  /** Se usa para `document.title` y, si no se pasa `breadcrumb`, como unico item del breadcrumb. */
  title: string;
  breadcrumb?: RouteBreadcrumbItem[];
}

/** Renderiza una pagina dentro de `container`. Puede devolver una funcion de limpieza, ejecutada antes de navegar a otra ruta. */
export type RouteRenderer = (container: HTMLElement, params: RouteParams) => void | (() => void);

export interface RouteDefinition {
  path: string;
  render: RouteRenderer;
  meta?: RouteMeta;
}

export type RouteChangeListener = (path: string, meta: RouteMeta | undefined) => void;

/**
 * Router SPA minimo basado en History API. Sin dependencias externas
 * (no hay framework). Cada pagina se registra con `register(path, render, meta?)`
 * y se monta dentro del contenedor del layout activo.
 *
 * Convencion de navegacion interna: cualquier <a> con el atributo
 * `data-link` intercepta el click y navega via pushState en vez de
 * recargar la pagina completa.
 */
export class Router {
  private readonly routes: RouteDefinition[] = [];
  private readonly container: HTMLElement;
  private readonly routeChangeListeners = new Set<RouteChangeListener>();
  private cleanup: (() => void) | void = undefined;

  constructor(container: HTMLElement) {
    this.container = container;
    window.addEventListener('popstate', () => this.render());
    document.addEventListener('click', (event) => this.handleLinkClick(event));
  }

  register(path: string, render: RouteRenderer, meta?: RouteMeta): this {
    this.routes.push({ path, render, meta });
    return this;
  }

  /** Se invoca en cada navegacion exitosa, con el path y los metadatos (titulo/breadcrumb) de la ruta. */
  onRouteChange(listener: RouteChangeListener): () => void {
    this.routeChangeListeners.add(listener);
    return () => this.routeChangeListeners.delete(listener);
  }

  start(): void {
    this.render();
  }

  navigate(path: string): void {
    if (path === window.location.pathname) return;
    window.history.pushState({}, '', path);
    this.render();
  }

  private handleLinkClick(event: MouseEvent): void {
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest('a[data-link]');
    if (!(anchor instanceof HTMLAnchorElement)) return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('http')) return;

    event.preventDefault();
    this.navigate(href);
  }

  private render(): void {
    const path = window.location.pathname;
    const match = this.matchRoute(path);

    this.cleanup?.();
    this.container.replaceChildren();

    if (!match) {
      console.warn(`[router] Sin ruta registrada para "${path}"`);
      return;
    }

    this.cleanup = match.route.render(this.container, match.params);

    for (const listener of this.routeChangeListeners) {
      listener(path, match.route.meta);
    }
  }

  private matchRoute(path: string): { route: RouteDefinition; params: RouteParams } | null {
    for (const route of this.routes) {
      const params = matchPath(route.path, path);
      if (params) return { route, params };
    }
    return null;
  }
}

function matchPath(pattern: string, path: string): RouteParams | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: RouteParams = {};

  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i];
    const actualPart = pathParts[i];
    if (patternPart === undefined || actualPart === undefined) return null;

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(actualPart);
    } else if (patternPart !== actualPart) {
      return null;
    }
  }

  return params;
}
