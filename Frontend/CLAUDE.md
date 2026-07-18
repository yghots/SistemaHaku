# CLAUDE.md — HAKU Courier Frontend

Esta es la guía permanente de arquitectura y convenciones del frontend. Se aplica a todo el proyecto, en todas las fases futuras. Cualquier decisión que la contradiga requiere aprobación explícita antes de implementarse.

## 1. Filosofía del proyecto

Un solo frontend para dos paneles (Administrador y Motorizado), construido con TypeScript vanilla sobre Vite — sin framework SPA. La prioridad, en este orden, es: **reutilización > consistencia visual > velocidad de implementación**. Nunca se sacrifica reutilización por rapidez.

El backend (NestJS + Prisma + MySQL) está **en Feature Freeze** y no se modifica desde este proyecto. El frontend se adapta exactamente a los endpoints, DTOs y códigos de estado ya existentes (ver `Backend/API_OVERVIEW.md` y `Backend/ARCHITECTURE.md`). Si algo que el frontend necesita no existe en el backend, se documenta como bloqueo — nunca se inventa un endpoint ni se asume un comportamiento no verificado.

## 2. Stack tecnológico (obligatorio y exclusivo)

- **Vite** — bundler y dev server.
- **TypeScript** — estricto (`strict: true` en `tsconfig.json`), sin `any` salvo excepciones puntuales y comentadas (ver `src/utils/dom.ts`).
- **HTML5 + DOM nativo** — sin JSX ni motores de templates.
- **Tailwind CSS v4** — única fuente de estilos (config CSS-first en `src/styles/index.css`, sin `tailwind.config.js`).
- **Axios** — único cliente HTTP (`src/services/http/http-client.ts`).
- **SweetAlert2** — única librería de alertas/confirmaciones/toasts.
- **Day.js** — única librería de fechas.
- **Lucide** (paquete `lucide`, no `lucide-react` ni ningún otro binding) — único set de iconos, vía el wrapper `src/components/icon/icon.ts`.
- **ESLint + Prettier** — calidad y formato de código.

**Prohibido:** React, Angular, Vue, Svelte, jQuery, Bootstrap, cualquier otro framework SPA, cualquier otra librería de fechas/alertas/iconos, `alert()`/`confirm()` nativos del navegador, `Date` nativo para lógica de negocio (Day.js siempre).

## 3. Patrón de componentes: funciones factory

No hay framework, así que "componente" significa: **una función TypeScript que devuelve un `HTMLElement` real** (o un handle con ese elemento adentro, cuando el componente necesita exponer métodos como `open()`/`close()`).

```ts
export function Button(props: ButtonProps): HTMLButtonElement {
  const button = el('button', { className: cn(...), onclick: props.onClick }, props.label);
  return button;
}
```

Reglas del patrón:

- Un componente **recibe props por objeto** y **devuelve el elemento ya construido** — nunca un string HTML, nunca `innerHTML`.
- Componentes con estado interno o ciclo de vida (Modal, Input con validación) devuelven un **handle** (`{ element, open, close, ... }`) en vez del elemento pelado.
- Usar siempre `el()` (`src/utils/dom.ts`) para crear elementos en vez de `document.createElement` + asignaciones repetidas.
- Usar siempre `cn()` (`src/utils/cn.ts`) para combinar clases de Tailwind condicionalmente — nunca concatenar strings de clases a mano.
- Nunca usar Web Components/Custom Elements: el Shadow DOM no convive bien con la hoja de estilos global de Tailwind. Toda la app vive en el DOM "normal" (light tree).
- Excepción explícita: los wrappers de SweetAlert2 (`components/alert`, `components/toast`) no devuelven un `HTMLElement` — SweetAlert2 gestiona su propio DOM. Exponen funciones async simples (`confirmDialog()`, `showSuccessToast()`, etc.).

## 4. Principios de diseño

- **SOLID**: cada componente/servicio tiene una única responsabilidad. Los componentes de UI nunca llaman a la API directamente — reciben datos y callbacks por props. Los servicios (`services/`) nunca manipulan el DOM.
- **DRY**: antes de escribir cualquier lógica, buscar si ya existe en `utils/`, `components/` o `services/`. Está **prohibido copiar código entre páginas o módulos**. Si dos páginas necesitan lo mismo, se extrae a un componente/utilidad/servicio compartido.
- **KISS**: preferir la solución más simple que resuelva el problema actual. No generalizar para casos hipotéticos futuros — esperar a que un segundo caso real lo pida (regla del "tercer uso" antes de abstraer, salvo que sea obviamente el mismo componente genérico de la lista de la sección 6).

## 5. Reglas de arquitectura y organización de carpetas

```
src/
  assets/       fonts, icons (estáticos, no lucide), images, logos
  components/   componentes genéricos y reutilizables (ver sección 6)
  layouts/      AuthLayout, AdminLayout, RiderLayout — estructura de cada panel
  pages/        páginas reales, agrupadas por panel (admin/, rider/) y módulo;
                un tercer subdirectorio por página (ej. profile/) solo cuando
                la página es genuinamente neutral entre paneles (ver mas abajo)
  router/       router SPA (History API), sin páginas registradas por defecto
  services/     llamadas a la API + lógica de datos (nunca DOM)
  config/       lectura de variables de entorno (único punto: config/env.ts)
  constants/    valores fijos compartidos (enums de UI, mapeos de labels, etc.)
  styles/       entrada de Tailwind + tokens de diseño (@theme)
  types/        tipos TypeScript compartidos (contratos de API, entidades)
  utils/        funciones puras reutilizables (el, cn, formateo, etc.)
  hooks/        funciones "composable" reutilizables sin estado de framework
                (ej. debounce, click-outside) — no es el concepto de React
```

- Cada módulo de negocio (`usuarios`, `pedidos`, `tiendas`, ...) vive únicamente dentro de `pages/admin/<módulo>/` o `pages/rider/<módulo>/`. Nunca se duplica un componente solo porque lo usan páginas de módulos distintos: ese componente sube a `components/`.
- Admin y Rider comparten **todo** excepto layout, páginas y rutas propias (regla explícita del proyecto).
- No es obligatorio llenar una carpeta antes de necesitarla, pero si se crea contenido, debe ir en la carpeta que le corresponde según esta tabla — no crear carpetas nuevas en `src/` sin necesidad real.
- `AuthLayout` **no lleva Sidebar** (a diferencia de Admin/Rider): decisión aprobada explícitamente en la Fase 2, ya que antes de iniciar sesión no existen rutas de negocio que ofrecer. Lleva un header mínimo (logo + tema) y Footer.
- `src/pages/placeholder-page.ts` es la página compartida para cualquier ruta del Sidebar que todavía no tiene pantalla real — no crear un archivo de página vacío por módulo pendiente, usar esta función.
- **Páginas genuinamente neutrales entre paneles** (Fase 11, ej. `pages/profile/profile.page.ts` — "Mi Perfil"): cuando una página completa (no solo un componente/función de soporte) debe ser exactamente la misma para Admin y Rider, sin que "pertenezca" más a un panel que al otro, vive en su propio subdirectorio de primer nivel bajo `pages/` (hermano de `admin/`/`rider/`), y se registra en `main.ts` en ambas rutas (`/admin/<modulo>` y `/rider/<modulo>`) apuntando a la misma función exportada. Distinto del caso de la Fase 8 (funciones de soporte compartidas que sí tienen un dominio "dueño", ej. `PedidoHistorial` vive en `pages/admin/pedidos/` y Rider la importa desde ahí) — ahí no se crea una carpeta nueva.

## 6. Componentes reutilizables

Comprometidos con evitar duplicación, los componentes son **genéricos y configurables por props**, nunca específicos de un módulo.

✅ Correcto: `DataTable`, `Modal`, `Input`, `Button`, `Pagination`, `SearchBar`, `Badge`, `Card`, `Select`.
❌ Incorrecto: `UsuariosTable`, `ClientesTable`, `PedidosModal`, `TiendaForm`.

Antes de crear un componente nuevo, preguntarse: _"¿esto puede resolverse extendiendo un componente existente con más props/composición?"_. Solo crear uno nuevo cuando representa una **responsabilidad visual distinta**, no cuando solo cambian los datos que muestra.

Componentes implementados (Fase 1 + Fase 2, catálogo completo del proyecto):

`Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Checkbox`, `Badge`, `Card`, `Modal`, `Loader`, `Skeleton`, `alert` (`confirmDialog`/`infoAlert`, cumple el rol de "ConfirmDialog"), `toast`, `SearchBar`, `DataTable`, `Pagination`, `EmptyState`, `Avatar`, `Breadcrumb`, `Dropdown`, `Tooltip`, `StatCard`, `Section`, `PageHeader`, `Icon`, `Navbar`, `Sidebar`, `Footer`.

`Input`/`Textarea`/`Select` comparten el mismo envoltorio (label + help text + error) a través de `src/utils/field-chrome.ts` — no duplicar ese markup si se agrega un nuevo tipo de campo; extender `FieldChrome`.

## 7. Design System oficial (Fase 2)

Fuente de verdad: `src/styles/index.css` (Tailwind v4, config CSS-first vía `@theme`). Todo lo demás en esta sección es documentación de convenciones — el valor real de cada token vive únicamente ahí.

### Temas (claro/oscuro)

- Estrategia: clase `.dark` en `<html>` (`@custom-variant dark (&:where(.dark, .dark *))`), no solo `prefers-color-scheme`.
- Toggle y persistencia: `src/utils/theme.ts` (`initTheme`, `toggleTheme`, `getTheme`, `onThemeChange`). Clave de `localStorage`: `haku-theme`.
- Por defecto: **claro**. `initTheme()` se llama una única vez, al principio de `main.ts`, antes de montar nada, para evitar parpadeo.
- Todo componente nuevo debe verse correctamente en ambos temas antes de darse por terminado. No crear una variante de componente "para modo oscuro".

### Colores

- **Tokens semánticos de layout** (cambian de valor entre temas, el nombre de la clase no cambia nunca): `bg-surface`, `bg-surface-elevated`, `bg-surface-muted`, `border-border-default`, `text-text-primary`, `text-text-secondary`, `text-text-muted`. Se usan para fondos/bordes/texto de layout (Card, Modal, Navbar, Sidebar, inputs, etc.).
- **Colores de acento** (mismo valor en ambos temas, con variante `dark:` puntual cuando el contraste lo requiere): `brand-*` (marca, único acento — paleta provisional hasta que exista una identidad de marca real), `success-*`, `warning-*`, `danger-*`, `info-*` (estados: éxito, advertencia, error, información). Usados en `Badge`, `Button` (variant `danger`), `StatCard` (trend), alertas.
- Nunca usar `slate-*`/hex sueltos directo en un componente nuevo: usar el token semántico equivalente.

### Tipografía

- Fuente: Inter, autoalojada vía `@fontsource/inter` (solo subconjuntos `latin`/`latin-ext`, suficientes para español — no importar otros subconjuntos, inflan el bundle sin necesidad).
- Pesos disponibles: 400 (regular), 500 (medium), 600 (semibold), 700 (bold).
- Escala: la escala estándar de Tailwind (`text-xs` … `text-2xl`). `PageHeader` usa `text-2xl` para `<h1>`, `Card`/`Section` usan `text-base`/`text-lg` para `<h2>`.

### Espaciados, bordes y radios

- Espaciado: escala estándar de Tailwind (base 4px). Convención: `p-5` en `Card`/`StatCard`, `gap-4`/`gap-6` entre secciones de una página, `px-4 sm:px-6` en Navbar y el área principal de los layouts.
- Radios: tokens `--radius-sm/md/lg/xl` → `rounded-lg` es el default para botones/inputs/cards/modal, `rounded-full` para `Avatar`/`Badge`/indicadores.

### Elevaciones y sombras

- Tokens `--shadow-xs/sm/md/lg`, deliberadamente sutiles (regla: "no sombras excesivas"). `Card`/`StatCard` usan `shadow-sm`; `Modal`/`Dropdown` usan `shadow-md`/`shadow-lg`. No introducir sombras más marcadas.

### Breakpoints

- Los estándar de Tailwind (`sm`/`md`/`lg`/`xl`/`2xl`). Uso actual: `lg` = desktop (Sidebar visible), por debajo de `lg` = tablet (Sidebar oculto, colapsable manualmente vía el botón del propio Sidebar). No hay optimización para móvil todavía (regla explícita de esta fase) — evitar que el layout se rompa por debajo de `sm`, pero no es el foco.

### Tamaños de iconos, botones e inputs

- Iconos (`Icon`, vía Lucide): 14 (elementos muy pequeños, ej. flechas de `Breadcrumb`), 16 (`sm`, default de `IconButton`/dentro de `Button`), 18 (`md`, default de `Icon` y de `IconButton`), 20 (`lg`), 24 (`EmptyState`).
- Botones (`Button`/`IconButton`): `sm` (h-8), `md` (h-10, default), `lg` (h-12).
- Inputs/Textarea/Select: altura alineada visualmente a `Button` `md` (`py-2`, `text-sm`).

### Estados visuales

- Hover: cambio de fondo/color sutil (`hover:bg-surface-muted`, etc.), transición `transition-colors`.
- Focus: siempre `focus-visible` (nunca `focus` a secas) con anillo/outline de 2px y offset — nunca quitar el outline sin reemplazo.
- Disabled: `opacity-50 cursor-not-allowed` en todo control interactivo.
- Loading: `Button` reemplaza su icono por `Loader`; `DataTable` reemplaza filas por `Skeleton`.

### Animaciones (únicamente estas, "suaves", nada llamativo)

- Hover: `transition-colors duration-150`/`duration-200`.
- Sidebar: `transition-all duration-200` sobre el ancho (colapsar/expandir).
- Dropdown/Modal: patrón de "doble `requestAnimationFrame`" — el elemento pasa de `hidden` a visible, y en el frame siguiente se le quitan las clases `opacity-0`/`scale-95` para que la transición CSS se dispare (ver `Modal`/`Dropdown`). Al cerrar, se hace el proceso inverso con un `setTimeout` igual a la duración de la transición antes de volver a `hidden`.
- Cambio de tema: `transition-colors duration-200` en `body` (ver `src/styles/index.css`).
- No agregar animaciones de entrada/salida más complejas (slide, bounce, etc.) sin aprobación.

### Alto máximo y scroll interno del `Modal` (regla permanente desde la corrección de la Fase 7)

El panel del `Modal` (`src/components/modal/modal.ts`) es `flex flex-col` con `max-h-[85vh]`: el header y el footer llevan `shrink-0` (siempre visibles), y solo el contenido central (`flex-1 min-h-0 overflow-y-auto`) hace scroll. Ningún formulario debe volver a quitar esta estructura ni compensar un formulario largo con soluciones puntuales (columnas, acordeones, etc. sin aprobación) — si un formulario tiene muchos campos, el scroll interno del `Modal` ya lo resuelve de forma genérica.

## 8. Convenciones de nombres

- Archivos: `kebab-case.ts` (`http-client.ts`, `admin-layout.ts`).
- Componentes (función exportada): `PascalCase` (`Button`, `DataTable`).
- Utilidades/servicios (función exportada): `camelCase` (`cn`, `confirmDialog`, `showSuccessToast`).
- Tipos/interfaces: `PascalCase`, props de componente como `<Nombre>Props` (`ButtonProps`), handles como `<Nombre>Handle` (`ModalHandle`).
- Alias de import: `@/` (raíz de `src`) y uno por carpeta de primer nivel (`@components`, `@layouts`, `@pages`, `@router`, `@services`, `@config`, `@constants`, `@types`, `@utils`, `@hooks`, `@styles`, `@assets`) — deben coincidir exactamente entre `tsconfig.json` y `vite.config.ts`.

## 9. Reglas de proceso (no negociables)

- **No inventar funcionalidades.** Si la documentación funcional o el backend no definen algo con claridad, se detiene el trabajo, se reporta la ambigüedad (problema, impacto, alternativas, recomendación) y se espera aprobación — igual que en el backend.
- **Implementar únicamente la fase actual.** No adelantar páginas, módulos ni lógica de negocio de fases futuras, aunque parezca "fácil de dejar lista".
- **Consultar antes de decisiones arquitectónicas importantes** (patrón de un tipo de componente nuevo, estrategia de manejo de estado, forma de un contrato de datos compartido) cuando no estén ya resueltas en este documento.
- **El backend está en Feature Freeze.** Cualquier necesidad no cubierta por la API existente se reporta; no se simulan datos ni se asume un endpoint que no existe.

## 10. Cliente HTTP y manejo de errores

Único cliente: `src/services/http/http-client.ts` (instancia de Axios con `baseURL`/`timeout` desde `config/env.ts`). Todo servicio de datos debe importar esta instancia, nunca crear una propia. Los errores se normalizan a la clase `HttpError` (`src/services/http/http-error.ts`) antes de llegar a cualquier código de página — nunca se maneja un `AxiosError` crudo fuera de `http-client.ts`. El interceptor de requests ya está preparado para adjuntar un JWT (`src/services/http/auth-token.ts`) el día que el backend lo implemente, sin tener que tocar el resto del cliente.

## 11. Sesión y autenticación (Fase 3)

El backend no emite JWT (Feature Freeze). La "sesión" es el objeto `usuario` devuelto por `POST /auth/login`, guardado en el cliente sin ningún mecanismo de validación server-side por request — ver la limitación de seguridad documentada en `FRONTEND_PROGRESS.md` (Fase 3) antes de asumir que esto es una sesión segura.

- **`SessionService`** (`src/services/session.service.ts`) es el **único** punto de acceso a `localStorage` para temas de sesión en todo el proyecto. Ninguna página, layout ni componente debe llamar a `localStorage` directamente para leer/guardar el usuario autenticado — siempre a través de `SessionService.saveSession/getCurrentUser/updateSession/hasSession/clearSession`.
- **`AuthService`** (`src/services/auth.service.ts`) es el único punto de llamadas al módulo de auth del backend. Ninguna página debe usar `httpClient`/axios directamente.
- **Preparado para JWT sin tocar el resto del sistema**: el día que el backend incorpore JWT, solo debería cambiar la implementación interna de `SessionService` (por ejemplo, guardar un token y derivar el usuario de él) y `src/services/http/auth-token.ts` (para leer ese token real) — páginas, layouts y componentes siguen consumiendo exactamente la misma API pública de `SessionService`.
- **Protección de rutas**: `src/router/route-guard.ts` (`withAuth`) envuelve cada `RouteRenderer` registrado y exige `SessionService.hasSession()` antes de renderizar; si no hay sesión, hace una navegación dura a `/login`. Depende únicamente de `SessionService`, nunca de un token/guard de JWT.
- **Transiciones de login/logout son navegación dura** (`window.location.href`, no enrutamiento SPA): al iniciar sesión, cerrar sesión, o detectar que el rol no corresponde al panel actual. Elegido deliberadamente (KISS) para que cada transición reinicie limpio todo el estado en memoria de la SPA (listeners del Router, del Sidebar, del tema, etc.) sin tener que construir un mecanismo de desmontaje/remontaje entre `AuthLayout`/`AdminLayout`/`RiderLayout`. La navegación interna dentro de un mismo panel (Sidebar, Breadcrumb) sigue siendo SPA normal, vía el Router.
- **Redirección por rol**: tabla única en `src/constants/roles.ts` (`DEFAULT_PATH_BY_ROLE`) — administrador → `/admin/dashboard`, motorizado → `/rider/dashboard`. Reutilizada tanto por `LoginPage` como por el bootstrap de `main.ts`; no duplicar este mapeo en otro lugar.
- **Logout**: único punto en `src/utils/logout.ts` (`logout()`), reutilizado por `AdminLayout` y `RiderLayout` al construir el `Navbar` (`onLogout`). `Navbar` no conoce `SessionService`: solo expone el callback `onLogout`, quien lo construye decide qué hacer (principio de que los componentes de UI no llaman a servicios directamente).

## 12. Infraestructura CRUD administrativa (Fase 4, patrón de referencia)

El módulo Usuarios (`src/pages/admin/usuarios/`) es la **implementación de referencia** para todo módulo administrativo (Tiendas, Sucursales, Clientes, Motorizados, Pedidos, Reportes). Ningún módulo futuro debe reimplementar esta orquestación: debe **configurar** la siguiente infraestructura, no copiarla.

- **`ResourceTable`** (`src/components/resource-table/resource-table.ts`): compone `SearchBar` (uno por cada filtro que el backend soporte) + `DataTable` + `Pagination`, maneja el estado de página/filtros y las recargas. Recibe `columns`, `fetchPage` y `filterFields`; nunca inventar un filtro que el endpoint no soporte. Único punto que un módulo nuevo debe configurar para tener un listado completo con carga/error/vacío/búsqueda/paginación funcionando.
- **`DataTable`** ahora soporta un estado `error` (con `onRetry` opcional) además de `loading`/vacío — mejora disponible automáticamente para todo módulo que la use, no solo Usuarios.
- **`FormModal`** (`src/components/modal/form-modal.ts`): compone el `Modal` existente con footer Cancelar/Guardar y estado de carga en el submit. Único mecanismo para modales de Crear/Editar en cualquier módulo. Se autodestruye al cerrarse (cada apertura crea una instancia nueva — no reutilizar una instancia entre aperturas).
- **`RowActions`** (`src/components/datatable/row-actions.ts`): menú de acciones por fila (`Dropdown` + `IconButton`), recibe una lista de acciones con `hidden` opcional para ocultar condicionalmente (ej. "Activar" cuando ya está activo).
- **`DetailList`** (`src/components/detail-list/detail-list.ts`): pares etiqueta/valor genéricos para la vista "Ver detalle" de cualquier entidad.
- **Patrón de formulario compartido crear/editar**: una única función `build<Entidad>Form({ mode: 'create' | 'edit', initial? })` por módulo (ver `usuario-form.ts`) que arma los campos una sola vez y expone `validate()` (valida formato/obligatoriedad en el cliente — complementa al backend, nunca reglas de negocio como unicidad) devolviendo `null` y marcando los campos si es inválido.
- **Manejo de errores del servidor**: siempre `infoAlert` (SweetAlert2, `icon: 'error'`) con el mensaje ya normalizado de `HttpError` — nunca se intenta mapear un 409/400 genérico a un campo específico (el backend no siempre lo permite, ej. "usuario o correo ya en uso" no indica cuál). Los errores de **formato/obligatoriedad detectados en el cliente** sí van junto al campo (`Input`/`Select`.`setError`).
- **Mapeo de filtros de texto**: cuando el backend expone más de un campo de búsqueda parcial (ej. `usuario` y `correo`), se exponen como filtros **separados y explícitos** (un `SearchBar` por campo), nunca como un único buscador combinado — el backend combina los filtros con AND, así que un solo término enviado a ambos campos simultáneamente casi nunca encontraría resultados reales.
- **Ordenamiento**: no implementado en ningún listado todavía porque ningún endpoint actual del backend expone un parámetro de orden configurable (siempre `orderBy: { id: 'asc' }` fijo). Si un futuro endpoint lo soporta, agregar la opción a `ResourceTable` en ese momento (no antes).

## 13. Navegación cruzada entre módulos y filtros por selección (Fase 5)

- **Acciones de `RowActions`/`Dropdown` que navegan en vez de ejecutar una mutación**: un item de acción puede llevar `href` en vez de `onSelect` (ej. "Ver sucursales" desde una fila de Tiendas → `/admin/sucursales?tiendaId=<id>`). Internamente se renderiza como `<a data-link>` (navegación SPA) en vez de `<button>`. No crear un componente de menú aparte para esto — es la misma `RowActions`/`Dropdown` de siempre, con un item que navega.
- **Filtros de `ResourceTable` con `Select` en vez de texto libre**: `filterFields` acepta `{ type: 'select', options, initialValue? }` además del `{ type: 'search' }` (SearchBar) por defecto. Usarlo cuando el backend filtra por un id/enum con un conjunto acotado de valores reales (ej. `tiendaId` en Sucursales) en vez de texto libre. `options` debe venir siempre de datos reales del backend, nunca simulados. `initialValue` permite pre-seleccionar el filtro leyendo un parámetro de la URL (`window.location.search`) al montar la página — patrón usado para que un enlace de navegación cruzada (ver punto anterior) llegue con el filtro correspondiente ya aplicado.
- **Selects poblados con listas de otro módulo** (ej. el `Select` de tienda en el formulario de Sucursales, o el `Select` de usuario-motorizado en el formulario de Motorizados): la página dueña del módulo dependiente es responsable de pedir esa lista a su servicio (`TiendasService`, `UsuariosService`, nunca un servicio nuevo) una sola vez al montarse, y reutilizarla tanto para el filtro de `ResourceTable` como para el formulario de crear/editar — nunca duplicar la llamada ni simular la lista. Cuando el backend no soporta el filtro exacto necesario para esa lista (ej. `GET /usuarios` no admite filtrar por `rol`), se pide la página completa (`limit: 100`, el máximo permitido) y se filtra client-side — no se simula ni se inventa un parámetro de query inexistente.
- **`src/utils/select-options.ts`** (`toSelectOptions(items, getValue, getLabel)`, Fase 6): única función para convertir una lista real de entidades en `SelectOption[]`. Usar siempre que un módulo puebla un `Select` con datos de otro servicio, en vez de repetir el `.map` manualmente — pensada explícitamente para reutilizarse en los selects de cliente/motorizado del futuro módulo de Pedidos.

## 14. Selectores dependientes y formularios autosuficientes (Fase 7)

- **`Select` con `setOptions`/`setDisabled`**: el `SelectHandle` (`src/components/select/select.ts`) expone, además de `wrapper`/`select`/`setError`, `setOptions(options)` (reemplaza las opciones en caliente, preservando el valor actual si sigue existiendo en la nueva lista) y `setDisabled(disabled)`. Usar esto para cualquier selector cuyo contenido dependa de otro campo del mismo formulario (ej. Sucursal según la Tienda elegida en Pedidos) — nunca crear un componente "select dependiente" aparte: siempre el mismo `Select`, con estas dos capacidades.
- **`src/utils/dependent-options.ts`** (`createDependentOptionsLoader(loadOptions)`): utilidad genérica (sin conocimiento de ningún módulo) que **únicamente** cachea las opciones cargadas por valor de "padre" — no decide si una respuesta en curso sigue siendo relevante cuando el padre cambió varias veces antes de que resolviera (eso depende del DOM/estado visible, que esta utilidad deliberadamente no conoce).
- **La protección contra respuestas obsoletas vive en quien manipula el DOM, no en la utilidad de caché** (corregido en la estabilización de la Fase 7, tras un bug real: la versión original del loader descartaba la escritura en caché de una respuesta tardía pero igual la devolvía, permitiendo que una tienda ya abandonada pisara el selector de Sucursal). El formulario dueño de la cascada debe llevar su propio contador de solicitud (`let latestRequestId`, incrementado en cada cambio del padre) y descartar el resultado si ese contador ya avanzó cuando la promesa resuelve — ver `handleTiendaChange` en `pedido-form.ts`.
- **Regla de la cascada**: el campo hijo empieza deshabilitado y vacío; solo se consulta su servicio cuando el padre tiene un valor, y solo si ese valor de padre no se consultó antes (cache del loader) — nunca precargar el hijo completo de antemano ni disparar una consulta por cada tecla/cambio sin necesidad.
- **Formularios que resuelven sus propios selectores**: cuando un formulario necesita datos de **múltiples** servicios para sus selectores (ej. `pedido-form.ts`: Cliente, Tienda y Sucursal), el formulario mismo llama a `ClientesService`/`TiendasService`/`SucursalesService` directamente (nunca Axios), en vez de recibir listas ya cargadas por props desde la página — a diferencia del patrón de un solo selector dependiente de otro módulo (Fase 5/6, sección 13), donde la página seguía siendo la dueña de la carga. Ambos patrones son válidos; elegir según cuántos servicios distintos necesita el formulario: 1 lista externa → la página la carga y se la pasa; 2+ selectores con dependencias propias → el formulario se autoabastece. Listas independientes entre sí (ej. Cliente y Tienda) se cargan en paralelo (`Promise.all`), nunca en cascada innecesaria.
- **Campos de auditoría no son selectores**: un campo que identifica "quién hizo la acción" (ej. `creadoPorId` en Pedidos) se completa automáticamente desde `SessionService.getCurrentUser()`, nunca se expone como un `Select` para que el usuario lo elija manualmente.
- **Autocompletar campos relacionados a partir de una selección** (Fase 7, corrección): cuando el backend documenta que un campo opcional reutiliza datos de otra entidad si se deja vacío (ej. `telefonoContacto` de Pedido usa el teléfono del Cliente), el formulario debe completar ese campo automáticamente al elegir la entidad relacionada, usando únicamente datos ya obtenidos del servicio correspondiente (nunca inventados) — y solo si el campo sigue vacío, para no sobrescribir un valor que el usuario ya haya editado a mano.
- **Una sesión de navegador puede quedar obsoleta sin que la app lo note** (recordatorio, no una regla nueva — ya documentado en la sección 11): como no hay JWT ni revalidación por request, si el usuario cuya sesión sigue activa en `localStorage` es eliminado del backend, cualquier acción que dependa de su `id` (ej. `creadoPorId` al crear un Pedido) fallará con `404` aunque el resto de la app siga funcionando con normalidad. No es un bug a "corregir" en el código: es la limitación de seguridad ya aceptada desde la Fase 3. Ante este síntoma, verificar primero si la cuenta de la sesión activa todavía existe antes de asumir un defecto de código.

## 15. Flujo operativo y paneles compartidos (Fase 8)

- **Sub-recursos y acciones de negocio de una entidad se agregan al servicio existente de esa entidad, no a uno nuevo**: el flujo operativo de Pedido (`/pedidos/:id/asignar-motorizado`, `/confirmar-recojo`, etc., más `/pedidos/:id/historial` y `/pedidos/:id/fotos`) vive en el backend en módulos separados (`flujo-pedido`, `historial-pedido`, `fotos-entrega`), pero todos cuelgan de la ruta `/pedidos/:id/...` — se extendió `PedidosService` con esos métodos en vez de crear un `FlujoPedidoService`/`HistorialPedidoService`/`FotosEntregaService`. Regla general: si la URL del endpoint cuelga de otro recurso, el método va en el servicio de ese recurso; solo un recurso raíz propio (`/incidentes`) justifica un servicio nuevo.
- **`src/utils/fetch-all-pages.ts`** (`fetchAllPages(fetchPage, pageSize?)`): recorre un endpoint paginado existente hasta reunir todos sus resultados. Usar únicamente cuando el backend no ofrece el filtro necesario (ej. "pedidos asignados a mí" — `GET /pedidos` no admite filtrar por `motorizadoActualId`, confirmado que responde `400` si se envía). El resultado se filtra/pagina en el cliente.
- **`ResourceTable` sobre un dataset ya calculado en el cliente**: cuando los datos de una tabla no vienen de un endpoint paginado propio (ej. el resultado de `fetchAllPages` + filtro por `motorizadoId`), se sigue reutilizando `ResourceTable`/`DataTable`/`Pagination`/`SearchBar` tal cual, pasando un `fetchPage` local que pagina/filtra el arreglo en memoria y devuelve una `Promise<PaginatedResponse<T>>` resuelta — nunca se crea una tabla nueva solo porque el origen de los datos no es un fetch directo al backend.
- **Después de una acción del flujo operativo, actualizar el estado local con la respuesta de la propia acción** (no volver a pedir todo el listado): cada endpoint de flujo devuelve el pedido ya actualizado; se reemplaza (o se quita, si pasó a un estado terminal) esa entrada en el arreglo en memoria y se llama `table.reload()` — evita una solicitud HTTP adicional y evita perder el resto del listado ya cargado.
- **Acciones visibles solo cuando el backend las aceptaría**: cada acción del flujo (asignar/confirmar recojo/iniciar ruta/etc.) se muestra únicamente cuando el estado actual del pedido (y, si aplica, el motorizado asignado) coincide con lo que el backend exige — nunca se añade una restricción de estado que el backend no exige (ver el caso de "Reasignar motorizado", que el backend permite en cualquier estado mientras haya un motorizado asignado).
- **Lógica de página compartida entre Admin y Rider**: cuando dos páginas de paneles distintos necesitan la misma función de renderizado (no una página ni una ruta, ej. `PedidoHistorial`/`PedidoFotos`), esa función vive en el módulo "de referencia" del dominio dentro de `pages/admin/<módulo>/` y se importa directamente desde `pages/rider/...` — "Admin y Rider comparten todo excepto layout, páginas y rutas propias" (sección 5) ya cubre este caso explícitamente. No crear una carpeta `pages/shared/` ni tocar la convención de carpetas para esto.

## 16. Infraestructura de Reportes (Fase 9)

- **`src/components/report-filters/report-filters.ts`** (`ReportFilters`): única infraestructura de filtros para todo el módulo de Reportes. Configurable por `fields` (unión discriminada `dateRange` | `select` | `search`); agregar un nuevo tipo de filtro es agregar un miembro a esa unión, nunca crear una barra de filtros específica para un reporte nuevo. No conoce endpoints/servicios/tablas: solo emite un `Record<string, string>` al aplicar. Cada página de reporte convierte ese objeto a los tipos exactos de su propio servicio.
- **Filtro de fecha = `Input` con `type="date"`**: no existe (ni debe crearse) un componente "DatePicker" propio — el control nativo del navegador ya cubre la necesidad. `fechaHasta` se interpreta como medianoche exacta de esa fecha (no "fin del día"): si un reporte necesita incluir un día completo, el usuario debe elegir el día siguiente como `fechaHasta` — no compensar esto sumando un día silenciosamente en el código sin que el usuario lo sepa.
- **KPIs (`StatCard`) vs. tabla (`ResourceTable`) leen el mismo filtro de dos formas distintas, a propósito**: cuando un módulo no tiene un endpoint de agregados/totales, los KPIs se calculan con `fetchAllPages` (recorre todas las páginas que coincidan con el filtro vigente y agrega en el cliente), mientras que la tabla sigue pidiendo al backend página por página a través de `ResourceTable` (más eficiente para solo mostrar filas). No es una duplicación de lógica: son dos necesidades distintas (agregado completo vs. página visible) sobre el mismo endpoint y el mismo filtro.
- **`ResourceTable` sin `filterFields` propios**: cuando los filtros de una página ya vienen de una fuente externa (`ReportFilters`), se pasa `ResourceTable` sin `filterFields` (o vacío) y el `fetchPage` que se le da lee los filtros externos desde una variable capturada por clausura. Como cambiar esos filtros externos no reinicia la página interna de `ResourceTable` (no expone ese método), la tabla se **reconstruye por completo** (nueva instancia de `ResourceTable`, reemplazando el contenedor) cada vez que se aplican filtros nuevos — nunca se llama `reload()` esperando que la página vuelva a 1.
- **`StatCard` con `description`/`variant`/`loading`**: el componente de KPI único del proyecto (ya existía desde la Fase 2) se extendió con estas tres props opcionales — nunca crear una tarjeta de KPI distinta; extender esta si falta algo.

## 17. Servicios fachada para páginas multi-dominio (Fase 10)

- **Cuando una página necesita datos de más de 2-3 dominios distintos para armar una sola vista compuesta** (ej. el Dashboard: Pedidos + Motorizados + Clientes + Tiendas + Sucursales + Reportes), no debe importar cada `*Service` directamente. Se crea un servicio fachada dedicado (ej. `src/services/dashboard.service.ts`) que internamente reutiliza los servicios de dominio ya existentes, dispara las consultas en paralelo, y devuelve **un único objeto tipado** con todo lo que la página necesita. La página solo conoce ese objeto y ese servicio — nunca los servicios de dominio subyacentes.
- **Ventaja de esta capa**: si el backend alguna vez expone un endpoint agregado equivalente (ej. `GET /dashboard`), solo el servicio fachada cambia — ningún componente ni página se toca.
- **`Promise.allSettled`, no `Promise.all`, quando cada sección puede fallar de forma independiente**: si una página muestra varios indicadores/widgets independientes entre sí (no todo-o-nada), un fallo puntual no debe tumbar el resto. El campo correspondiente en el objeto devuelto queda en `null` (nunca un valor inventado) y la página muestra el estado de error únicamente en esa sección puntual.
- **Cuando el endpoint disponible no ordena como se necesita**: antes de reconstruir manualmente el orden deseado (ej. "calcular la última página" como se hizo en la Fase 8 para `motorizadoActualId`), revisar si existe otro endpoint que ya devuelva los mismos datos con el orden correcto (ej. `ReportesService.reportePedidos` ordena `creadoEn: desc`, a diferencia de `PedidosService.listar`, que siempre ordena `id: asc`) — evita reinventar una solución ya resuelta en otro endpoint del mismo dominio.

## 18. Componentes flotantes: Portal a `document.body` (Bugfix, 2026-07-14)

- **`Dropdown` se posiciona vía Portal, nunca vía `position: absolute` dentro de su propio árbol DOM**: mientras está abierto, el panel se reubica como hijo directo de `document.body` con `position: fixed`, y su `top`/`left` se calculan respecto al `trigger` real (`getBoundingClientRect()`). Al cerrarse, vuelve a su `wrapper` original. Esto es obligatorio para **cualquier** componente flotante futuro (menús, popovers, etc.) que pueda abrirse dentro de una tabla, un `Card`, un `Modal` o cualquier contenedor con `overflow` distinto de `visible` — un panel `absolute` anidado en esos contenedores queda recortado (ver la causa raíz documentada en `FRONTEND_PROGRESS.md`, entrada "Bugfix — Dropdowns cortados por contenedores"). No volver a implementar un panel flotante con `position: absolute` sin pasar por este patrón.
- **`src/utils/floating-position.ts`** (`computeFloatingPosition`): función pura que calcula la posición (`top`/`left`, con apertura hacia arriba/abajo e izquierda/derecha según el espacio disponible en el viewport) para cualquier componente flotante respecto a su trigger. Reutilizar esta utilidad para cualquier nuevo componente posicionado (ej. si `Tooltip` alguna vez necesita el mismo comportamiento) — no duplicar el cálculo.
- **Reposicionamiento mientras está abierto**: `scroll` en fase de **captura** sobre `window` (imprescindible para detectar scroll de contenedores internos con overflow, ya que ese evento no burbujea) + `resize` (cubre también zoom del navegador). Ambos se agregan solo al abrir y se remueven al cerrar.
- **z-index de paneles flotantes por encima de `Modal`**: `Dropdown` usa `z-[60]`, superior al `z-50` del overlay de `Modal`, para que un menú abierto dentro de un modal siempre sea visible.
- **Un único `Dropdown` abierto a la vez, en todo el proyecto** (Bugfix, 2026-07-14): `dropdown.ts` mantiene una variable de módulo (`activeDropdownClose`) que registra el `close` del Dropdown actualmente abierto; abrir uno nuevo cierra automáticamente el anterior antes de continuar. Es el mecanismo de coordinación por defecto para cualquier componente flotante singleton del proyecto — no reintroducir múltiples paneles abiertos simultáneamente ni duplicar esta coordinación por fuera de `dropdown.ts`.

## 19. Elegir el endpoint correcto entre módulos equivalentes (Fase 12)

- **Antes de recurrir a `fetchAllPages` (Fase 8) para simular un filtro que un endpoint no soporta, revisar si otro endpoint del mismo dominio ya lo soporta de verdad**: `PedidosService.listar` (`GET /pedidos`) no admite filtrar por `motorizadoId`, pero `ReportesService.reportePedidos` (`GET /reportes/pedidos`) sí — y además ordena `creadoEn: desc` de forma nativa. El Dashboard del Motorizado (Fase 12) usa `reportePedidos` en vez de recorrer todas las páginas de `PedidosService.listar`, evitando N solicitudes innecesarias. Antes de recorrer todas las páginas de un endpoint, comprobar si un endpoint hermano (reportes, listados alternativos) ya expone el filtro necesario.
- **Nunca anidar un elemento interactivo dentro de otro** (ej. un `Button`, que renderiza `<button>`, dentro de un `<a data-link>`): es HTML inválido (contenido interactivo anidado, prohibido por la especificación) y produce comportamiento de foco/clic inconsistente entre navegadores. Cuando una acción visualmente identica a `Button` debe navegar (no ejecutar un `onClick`), construir el `<a data-link>` reutilizando `BUTTON_VARIANT_CLASSES` (exportado desde `components/button/button.ts`) en vez de anidar el componente `Button` — mismo aspecto, HTML válido.

## 20. Responsive: Drawer, tarjetas automáticas y área táctil (Fase 13)

- **Un componente, dos comportamientos por breakpoint — nunca un componente "Mobile" paralelo**: `Sidebar` es el ejemplo de referencia. En `lg`+ es la barra colapsable de Desktop de siempre; por debajo de `lg` el mismo árbol de nodos se comporta como Drawer (`position: fixed`, backdrop, `-translate-x-full` ↔ `translate-x-0`, cierre al elegir opción/tocar backdrop/Escape). El cambio de comportamiento es puramente CSS (clases `lg:`) más el estado JS mínimo indispensable (abierto/cerrado) — nunca una segunda implementación ni un prop "isMobile".
- **`display: contents` para envolver nodos que no deben afectar el layout del padre**: cuando un componente necesita devolver más de un nodo raíz (ej. `Sidebar` con `<aside>` + backdrop) pero su consumidor (`AdminLayout`/`RiderLayout`) solo espera insertar un único `element` como hijo directo de un contenedor `flex`, envolver ambos en `<div class="contents">` — sus hijos participan del layout del padre como si el wrapper no existiera. Preferir esto sobre reestructurar el layout consumidor.
- **`DataTable` genera automáticamente una vista de tarjetas para `< sm`, a partir de las mismas `columns`**: ninguna página pasa una prop nueva ni construye su propio markup mobile. Regla de generación (ya era la convención de facto en cada tabla del proyecto): la primera columna con `header` no vacío es el título de la tarjeta; una columna con `header: ''` (la convención ya usada para `RowActions`) se ubica junto al título; el resto se apila como pares etiqueta/valor. Si se agrega una tabla nueva, **no hay nada que hacer para que funcione en mobile** — ya funciona por heredar `DataTable`. No crear una "vista card" específica de ningún módulo.
- **Área táctil (~44×44) sin agrandar el diseño Desktop**: dos técnicas, elegidas según si el control está aislado o pegado a otros.
  - **Aislado** (ej. `IconButton` tamaño `sm`, usado en `RowActions`): pseudo-elemento `::before` invisible, centrado, de 44×44 (`before:absolute before:h-11 before:w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']`) — agranda solo el área de toque, el botón se ve exactamente igual. `content-['']` es obligatorio: sin contenido el pseudo-elemento no se genera.
  - **Pegado a otros controles** (ej. `Pagination`): el pseudo-elemento invisible se descarta a propósito — las zonas invisibles de controles vecinos se superpondrían y causarían pulsaciones accidentales. En su lugar se agranda el control real un poco (32px → 36-44px reales) y/o se aumenta el `gap` entre ellos.
  - **Fila completa clicable** (ej. `Checkbox`, cuyo `<label>` es el área real de toque): `padding` vertical en el `<label>`, no en el control visual (`input[type=checkbox]` se mantiene en 16px).
- **Safe Areas con `env(safe-area-inset-*)`, siempre combinado con `max()`/`calc()` sobre el padding ya existente, nunca reemplazándolo**: así el resultado en cualquier dispositivo sin notch (Desktop y la inmensa mayoría de móviles) es matemáticamente idéntico al valor anterior (`max(1rem, env(...))` = `1rem` cuando el inset es `0`). Requiere `viewport-fit=cover` en el `<meta viewport>` de `index.html` — sin ese flag, `env()` siempre vale `0` y las clases son no-op permanentes. Aplicar únicamente en elementos que tocan un borde real de la pantalla (headers, footers, Drawer, Modal a pantalla completa en mobile) — no en cada componente.

## 21. Gestión de foco en componentes flotantes (Fase 15, corrección de auditoría)

- **`src/utils/focus-trap.ts`** (`focusFirstElement`, `trapTabKey`, `restoreFocus`): utilidad única y obligatoria para cualquier componente que abra un panel/diálogo flotante con comportamiento propio de apertura/cierre (`Modal`, `Dropdown`, y cualquier componente similar futuro). Un componente flotante nuevo **debe** reutilizar estas tres funciones — no reimplementar gestión de foco a mano ni omitirla.
  - Al abrir: guardar `document.activeElement` como disparador, y llamar `focusFirstElement(container)` para mover el foco al primer elemento enfocable del panel (o al propio `container`, que debe llevar `tabindex="-1"`, si no tiene ninguno).
  - Mientras está abierto: el `keydown` que el componente ya mantiene para `Escape` debe delegar también en `trapTabKey(event, container)` — no agregar un listener nuevo, solo esa llamada adicional.
  - Al cerrar: llamar `restoreFocus(container, disparadorGuardado)`. Esta función **solo** devuelve el foco si `document.activeElement` todavía está dentro de `container` en ese momento — nunca robar el foco a algo que se haya abierto como consecuencia de la propia acción que cerró el panel (ej. un item de `Dropdown` cuyo `onSelect` abre un `Modal` antes de que el `Dropdown` termine de cerrarse).
- **Componentes que reubican su panel a `document.body` (Portal, ver sección 18) son los que más necesitan esto**: al vivir fuera de su posición original en el DOM, el orden natural de `Tab` del navegador no los alcanza — sin gestión de foco explícita, quedan completamente inoperables por teclado.

## 22. Nombre completo de una persona (Fase 16)

- **`src/utils/nombre-completo.ts`** (`nombreCompleto({ nombres, apellidos })`): única función del proyecto que concatena `nombres`/`apellidos` de un `Usuario`. Cualquier pantalla que necesite mostrar el nombre completo de una persona debe reutilizar esta función — nunca concatenar esos dos campos a mano en un punto nuevo.
- **Regla para decidir entre mostrar el nombre completo o el `usuario` (login)**: cuando la información mostrada está orientada a **identificar a la persona** (saludo/avatar del usuario autenticado en `Navbar`, encabezado de "Mi Perfil", confirmaciones de acciones sobre una cuenta ajena), usar `nombreCompleto`. Cuando está orientada a **autenticación o administración técnica de la cuenta** (el propio campo `usuario` como credencial de login, selectores que vinculan una cuenta existente a otro registro), mantener `usuario`. Ambos pueden coexistir en la misma pantalla (ej. la tabla de Usuarios muestra "Nombre completo" y "Usuario" como columnas separadas) — no es una sustitución, es una adición contextual.

## 23. Representación de un motorizado (Fase 17)

- **Regla permanente: los motorizados siempre deberán representarse mediante Nombre Completo + Placa. La placa nunca deberá utilizarse como único identificador visual para el usuario.**
- **`src/utils/format-motorizado.ts`** (`formatMotorizado({ nombres, apellidos, placa })`): única función del proyecto que define esa representación ("Carlos Rojas · F8-0002"). Reutiliza `nombreCompleto` (sección 22) en vez de volver a concatenar `nombres`/`apellidos` — no duplicar esa lógica. Cualquier Select, columna de tabla o `DetailList` que muestre un motorizado debe reutilizar esta función.
- **Excepción explícita, ya evaluada**: la pantalla de Usuarios (`pages/admin/usuarios/`, que desde la Fase 33 administra también el perfil operativo del motorizado — ver sección 34), donde `placa` es un campo nativo del registro que se está administrando directamente (no una referencia a un motorizado desde otra pantalla), puede seguir mostrando `placa` como columna propia. La regla aplica a **toda pantalla que identifique a un motorizado desde otro contexto** (Pedidos, Reportes, Incidentes, Historial), no a la pantalla que edita sus propios datos. (Hasta la Fase 33 esta excepción aplicaba al CRUD independiente de "Motorizados", retirado en esa fase — ver sección 34.)
- **Dos líneas en vez de una**: si un componente futuro necesita partir la representación en dos líneas visuales, reutilizar `nombreCompleto(motorizado)` y `motorizado.placa` por separado — no crear una segunda función de formato.

## 24. Exportación de reportes (Fase 18)

- **`ExportButton`** (`src/components/export-button/export-button.ts`): único componente de "Exportar" del proyecto. Compone `Button` + `Dropdown` tal cual existen (nunca crear un botón por formato ni un Dropdown especial). Recibe una única prop, `onExport: (formato: FormatoExportacion) => Promise<void>`, y no conoce el reporte ni el endpoint — cualquier pantalla nueva que exponga exportación debe reutilizar este componente, nunca reimplementar el Dropdown de formatos.
- **Los servicios de exportación solo devuelven `{ blob, filename }`, nunca descargan**: un método de servicio que llama a un endpoint `/export` (`responseType: 'blob'`) debe devolver `ArchivoDescargable` (`src/types/export.ts`) y dejar que quien lo llama invoque `downloadBlob` (`src/utils/download-file.ts`) — los servicios no manipulan el DOM (regla ya existente, sección 4).
- **El nombre de archivo siempre se lee del header `Content-Disposition`** (`filenameFromContentDisposition`, `src/utils/download-file.ts`) — el frontend nunca genera ni inventa su propio nombre de archivo; el backend ya lo decide de forma determinista (título del reporte + timestamp).
- **`responseType: 'blob'` en una request de axios puede traer un error como `Blob`, no como JSON**: `src/services/http/http-client.ts` ya lo resuelve (`resolveErrorBody`, Fase 18) parseando el `Blob` a texto/JSON antes de normalizar el `HttpError`. Cualquier nuevo servicio que use `responseType: 'blob'` no necesita repetir este manejo — ya está cubierto por el cliente HTTP central.

## 25. Arquitectura de scroll del layout raíz (Bugfix, 2026-07-14)

- **El único contenedor con scroll de la aplicación es el área de contenido principal. Sidebar y Navbar permanecen estáticos durante toda la navegación.** `AdminLayout`/`RiderLayout` acotan su raíz y su columna interna a `h-screen` (techo real, nunca `min-h-screen` — un mínimo no evita que el documento termine haciendo scroll) y delegan el scroll exclusivamente a un `scrollArea` (`min-h-0 flex-1 overflow-y-auto`, mismo patrón ya establecido en `Modal`, sección 7) que envuelve `mount` (donde el Router monta cada página) seguido de `Footer` — así `Footer` sigue perteneciendo al contenido y aparece únicamente al llegar al final de su scroll, nunca fijo en pantalla.
- **Regla para cualquier layout nuevo o modificado**: si un contenedor debe comportarse como "raíz que nunca se desplaza" (Sidebar, Navbar, cualquier chrome de navegación futuro), acotar su ancestro a una altura real (`h-screen`/`h-full`, nunca `min-h-*`) y dar el scroll únicamente al contenedor de contenido (`min-h-0 flex-1 overflow-y-auto`) — nunca usar `position: fixed` como atajo para "fijar" navegación cuando el problema real es un contenedor sin techo de altura.
- **Ninguna página individual necesita saber esto**: todo módulo (Dashboard, Usuarios, Pedidos, Reportes, etc.) se monta dentro de `mount` sin cambios — el comportamiento de scroll se hereda automáticamente del layout, nunca se configura por página.

## 26. Centro de Importaciones y modales de varios pasos (Fase 19)

- **Modal de varios pasos: un único `Modal`, contenido reemplazado por paso — nunca anidar un segundo Modal ni crear uno nuevo por paso.** `FormModal` (sección 12) sigue siendo el patrón de referencia para un único paso (formulario → guardar); para un flujo de varios pasos (ej. seleccionar archivo → analizar → vista previa → confirmar → resultado, o lista → detalle), construir el `Modal` con un `stepContainer`/`footerContainer` propios y reemplazar su contenido (`replaceChildren`) en cada paso. Ver `src/pages/admin/importaciones/import-wizard-modal.ts` y `historial-modal.ts` como referencia.
- **Primer servicio que sube un archivo**: `src/services/importaciones.service.ts` arma un `FormData` (campo `archivo`) y lo envía por `httpClient.post` — ningún otro servicio del proyecto necesitaba esto hasta ahora. Reutilizar este mismo patrón (no crear un cliente HTTP aparte) para cualquier subida de archivo futura.
- **Reutilizar `responseType: 'blob'` + `filenameFromContentDisposition` (Fase 18) para toda descarga binaria nueva** (plantillas, reportes de errores, o cualquier archivo futuro que el backend genere) — no reinventar la descarga por módulo.
- **Metadata estática de un catálogo de entidades (nombre, descripción, campos, reglas) vive en un `*.config.ts` propio del módulo** (`entidad-importacion.config.ts`), nunca hardcodeada dentro del componente que la consume — permite agregar una entidad nueva (o, en otro módulo, un ítem de catálogo nuevo) sin tocar la lógica de UI.

## 27. Sub-recursos armados en memoria antes de una acción posterior (Fase 21, generalizado en la Fase 20.1)

- **Cuando una acción necesita registrar varios sub-recursos antes de (o como condición de) otra acción posterior** — ej. los pagos de un pedido nuevo antes de crearlo (Fase 21, desde entonces revertido), o los pagos cobrados al cliente antes de confirmar la entrega (Fase 20.1, `confirmar-entrega-form.ts`) — esos sub-recursos se arman en memoria como una lista temporal (agregar/quitar, reutilizando el mismo mini-formulario del sub-recurso, ej. `buildPagoForm()` — nunca uno nuevo) y **nunca se envían en el mismo payload que la acción principal** (el DTO de esa acción no cambia). El **formulario nunca llama servicios de mutación el mismo** (regla ya existente, sección 4: los componentes de UI no llaman a la API directamente) — solo expone la lista pendiente y una forma de ir marcando cada ítem como registrado; quien orquesta las llamadas HTTP es siempre la página (el `onSubmit` del `FormModal` que lo envuelve).
- **Registro secuencial, nunca en paralelo ni simulando una transacción distribuida**: cada sub-recurso se registra contra su endpoint ya existente (el mismo que usa cualquier acción de "agregar uno más" fuera de este flujo) uno por uno. **Apenas un sub-recurso se registra con éxito, se quita de inmediato de la lista pendiente** — así, si uno posterior falla y el usuario reintenta, nunca se reenvía (ni duplica) un sub-recurso ya persistido.
- **Qué pasa si un sub-recurso falla depende de si la acción principal ya es irreversible**: si la acción principal (ej. crear el pedido) ya ocurrió antes de que empezara el registro de sub-recursos, esta nunca se pierde ni se revierte — se muestra el error y el usuario completa los pendientes después. Si la acción principal todavía no ocurrió y depende de que todos los sub-recursos se hayan registrado (ej. confirmar la entrega), esa acción **nunca se ejecuta** ante el primer fallo — se detiene ahí, se muestra el error, y los sub-recursos ya exitosos quedan como registros válidos (no hay manera de "deshacerlos": ver la naturaleza inmutable de los pagos, sección de Pagos en `Backend/ARCHITECTURE.md`).
- Reutilizar este patrón para cualquier flujo futuro con la misma forma (una acción que depende de N sub-recursos previos, o que debe encadenar varios tras de sí) en vez de inventar una variante nueva por módulo.

## 28. Formateo de dinero (Bugfix de localización, 2026-07-15)

- **`src/utils/format-monto.ts`** (`formatMonto`) es la **única** utilidad de formateo de dinero del proyecto — cualquier pantalla que muestre un monto (KPI, `StatCard`, `DataTable`, `DetailList`, modal, formulario de solo lectura, etc.) debe reutilizarla. **Nunca concatenar un símbolo de moneda a mano** (`` `$${valor}` ``, `'S/' + valor`, etc.) en un componente o página nuevos.
- Implementada con `Intl.NumberFormat` nativo (sin librerías externas): separadores de miles, dos decimales y el símbolo de la moneda los resuelve el propio `Intl` — la función nunca construye el string a mano.
- **La moneda vigente vive en una única constante (`MONEDA_ACTUAL`) dentro de `format-monto.ts`**, desacoplada de todo componente. El sistema es exclusivamente para Perú (Sol, `PEN`/`es-PE`); si una fase futura necesita soportar otra moneda, **solo se edita esa constante** — ningún componente que llama a `formatMonto` debe tocarse.
- `null`/`undefined`/un valor no numérico se muestran como `"—"` (mismo criterio ya usado en el resto de la app para "sin dato").

## 29. Representación de campos opcionales sin valor (Bugfix, 2026-07-15)

- **`src/utils/format-optional.ts`** (`formatOptional`, constante `SIN_VALOR_LABEL = 'No registrado'`) es la **única** forma de representar un campo de texto opcional sin valor. `null`/`undefined`/`""` → `"No registrado"`; con información real, se muestra exactamente igual, sin modificarla. **Nunca** escribir `valor ?? 'No registrado'` (ni ningún otro texto: `"—"`, `"vacío"`, `"N/A"`) directamente en un componente — siempre reutilizar esta función.
- **Cuando el valor real se transforma antes de mostrarse** (ej. un id que se resuelve a una etiqueta mediante una función de lookup, o un id que se antepone con `#`), `formatOptional` no aplica directamente sobre el resultado — en ese caso, reutilizar la constante `SIN_VALOR_LABEL` como la rama "sin valor" del propio condicional (`campo ? transformar(campo) : SIN_VALOR_LABEL`), nunca un literal de texto nuevo.
- **`formatMonto` (sección 28) reutiliza la misma `SIN_VALOR_LABEL`** para sus casos `null`/`undefined`/no-numérico — un monto opcional sin valor (ej. "Valor del producto" sin completar) se representa con el mismo texto que cualquier otro campo opcional, nunca con `"—"` ni con `"S/ 0.00"` (que representaría un monto real de cero, un dato distinto).
- **No aplica a estados de carga ni de error parcial**: un `StatCard` con `loading: true` (dato todavía no solicitado) o un KPI en `null` por un fallo de una sección independiente (patrón `Promise.allSettled`, sección 17 — con su propio `description: 'No se pudo obtener'`) **no** son "campos opcionales sin valor" y no deben mostrar `SIN_VALOR_LABEL` — son estados de carga/error, semánticamente distintos de "el dato no existe".

## 30. Sistema de temas: Design Tokens de 3 vías — Light/Dark/Midnight (Fase 21)

- **Todo color que dependa del tema vive exclusivamente en `src/styles/index.css`, nunca en un componente.** El archivo define, para cada tema (`:root` = Light, `.dark` = Dark, `.midnight` = Midnight), el mismo conjunto de custom properties (`--surface`, `--surface-elevated`, `--surface-muted`, `--surface-hover`, `--surface-sidebar`, `--surface-navbar`, `--border-default`, `--text-primary/secondary/muted`, `--soft-<color>-bg/fg` por cada acento, `--avatar-fallback-bg/fg`, `--tooltip-bg/fg`, `--overlay-scrim`, `--shadow-xs/sm/md/lg/button`), mapeadas una sola vez dentro de `@theme` a nombres `--color-*`/`--shadow-*` que Tailwind expone como utilidades (`bg-surface-hover`, `text-soft-brand-fg`, `shadow-button`, etc.). **Un componente nuevo que necesite un color nunca debe preguntarse "¿qué tema está activo?" — solo debe usar el token semántico correcto y listo.**
- **`--surface-muted` vs. `--surface-hover` son conceptos distintos, no intercambiables**: `--surface-muted` es un fondo **estático** recesivo (fondo de página, fila de tabla en loading, icono de `EmptyState`, `Skeleton`); `--surface-hover` es el tinte de **interacción** (hover de filas/links/items de menú, encabezado de tabla). En Light/Dark ambos valen exactamente lo mismo (cero diferencia visual), pero en Midnight son intencionalmente distintos (`--surface-muted` es el fondo más oscuro de toda la paleta, `--surface-hover` es más claro que las Cards) — usar el que no corresponde produce un hover que se ve "más oscuro" en vez de "resaltado".
- **Nunca escribir `dark:` en un componente nuevo para un color identity-bearing** (badge, chip de ícono, avatar, item activo de navegación): esos SIEMPRE deben consumir un par `--soft-<color>-bg`/`--soft-<color>-fg` (o crear uno nuevo si hace falta un acento distinto) — el valor exacto por tema vive en `index.css`, el componente solo referencia el nombre del token. El variant compartido **`dark-ui:`** (`&:where(.dark, .midnight, ...)`) existe **únicamente** para micro-ajustes cosméticos de una sola línea sin identidad propia (ej. un tinte `white/10` en el hover de un botón) — no usarlo para nada que represente un estado o categoría de negocio.
- **Profundidad por capas de superficie, nunca por degradados**: Midnight logra la sensación "premium" estratificando `--surface-muted` (fondo) < `--surface-sidebar`/`--surface-navbar` < `--surface-elevated` (Cards/Modal/Dropdown/StatCard) < `--surface-hover`, cada uno un tono ligeramente distinto — nunca un `linear-gradient`. Cualquier superficie nueva debe insertarse en esta escala, no inventar un quinto tono suelto.
- **Paleta de acento (`brand`/`success`/`warning`/`danger`/`info`) es idéntica en los 3 temas** — nunca redefinirla por tema; solo las superficies/bordes/texto y los tonos "suaves" derivados cambian. Esto es lo que permite que "mantener el azul institucional" sea automático: ningún botón/link necesita saber en qué tema está.
- **El selector de tema (`src/utils/theme.ts`) es un ciclo de 3 valores** (`light → dark → midnight → light`, vía `toggleTheme()`) más `setTheme(tema)` para elegir uno explícito (usado por la tarjeta "Tema" de Mi Perfil). Agregar un cuarto tema en el futuro implica: 1) un nuevo bloque de custom properties en `index.css` con el mismo set de nombres, 2) un nuevo `@custom-variant` si el tema necesita su propio selector aislado, 3) agregarlo al arreglo `THEMES` de `theme.ts` y a `THEME_TOGGLE_ICON` (`components/navbar/navbar.ts`) — nunca tocar un componente de UI existente.

## 31. Captura y optimización de fotografías (Fase 22)

- **Toda captura de fotografía del proyecto reutiliza `PhotoCapture`** (`src/components/photo-capture/photo-capture.ts`) — nunca crear un `<input type="file">` de captura nuevo por pantalla. Un único input `accept="image/*" capture="environment"` cubre cámara trasera en móvil **y** selector de archivos en Desktop/Tablet/navegadores sin soporte, sin ninguna detección de capacidades por JavaScript — es el propio navegador quien decide, por especificación. No reintroducir una rama `if (soportaCaptura)` para esto.
- **Toda optimización de imagen reutiliza `utils/optimizar-foto.ts`** (`browser-image-compression`, Web Worker) — **nunca implementar compresión/redimensionado manual con Canvas** salvo una razón técnica muy justificada y documentada. Parámetros (lado mayor 1280px, WebP, ~78% calidad) están centralizados ahí; ninguna pantalla debe exponer control alguno de resolución/formato/calidad al usuario — la optimización es siempre 100% automática y transparente.
- **La imagen original nunca se envía ni se muestra**: la vista previa que ve el usuario, y el archivo que se envía al backend, son siempre el resultado ya optimizado — nunca el archivo crudo capturado por la cámara.
- **Librerías pesadas usadas por un único flujo (no toda la app) se importan de forma perezosa** (`await import(...)` dentro de la función que las usa, nunca en el top-level del módulo) — `optimizar-foto.ts` es el primer caso; Rollup la separa en su propio chunk, evitando que paneles que nunca capturan fotos (Admin, Reportes, Dashboard) paguen ese peso.
- **Envío de fotografías: siempre `multipart/form-data`** (el servicio arma el `FormData` internamente, igual que `importaciones.service.ts`, Fase 19) — nunca Base64, nunca JSON con la imagen embebida.

## 32. Identificador visible de un pedido: siempre `codigoPedido`, nunca el `id` interno (Fase 24)

- **Ninguna pantalla debe mostrar el `id` interno de un pedido como su identificador visible** — el `id` es autoincremental y solo debe usarse para navegación, relaciones y llamadas a la API. El identificador de negocio que el usuario ve siempre es `codigoPedido` (formato `PED-AAAA-NNNNNN`, generado por el Backend — `PedidoCodigoGenerator` — nunca en el Frontend).
- Cuando otra entidad solo tiene el `pedidoId` (ej. un incidente), resolverlo a `codigoPedido` con el mismo patrón ya usado para `motorizadoLabel`/`clienteLabel` en el proyecto: un mapa `id → codigoPedido` poblado con `PedidosService.listar(...)`, nunca mostrar el id crudo ni concatenarlo a mano (`#${id}`).

## 33. Ciclo de vida de Usuarios y Motorizados (Fase 33)

- **Regla permanente: el historial del negocio es inmutable.** Ningún usuario que haya participado en un proceso operativo (pedidos, pagos, historial, importaciones, o tener un perfil de motorizado asociado) puede eliminarse — el Backend rechaza el intento con `409` y un mensaje explícito. La **desactivación** (`Usuario.activo`, acción "Desactivar" ya existente en `usuarios.page.ts`) es el mecanismo oficial de salida de personal: conserva todo el historial, bloquea el login, y excluye al usuario de los listados por defecto sin dejar de ser consultable.
- **La pantalla de Usuarios es también donde se administra el perfil operativo del motorizado** (placa) — no existe una pantalla `/admin/motorizados` independiente. Se retiró en esta fase porque, sin `PerfilMotorizado.estado` (eliminado por no participar en ninguna regla de negocio real), la única información propia de ese módulo era la placa: insuficiente para justificar un CRUD separado cuando el resto de los datos ya pertenece a Usuarios. Si un futuro perfil de motorizado necesitara campos adicionales genuinamente propios (no solo una etiqueta más), reevaluar si amerita una pantalla dedicada — no asumir que debe seguir viviendo dentro de Usuarios para siempre.
- **Patrón de campo condicional según rol**: `usuario-form.ts` muestra el campo "Placa" únicamamente cuando el `Select` de rol tiene el valor "Motorizado" (toggle vía `onChange` + clase `hidden` en el wrapper) — reutilizar este mismo patrón para cualquier campo futuro que solo aplique a un rol/tipo específico, en vez de crear un formulario alternativo.
- **Creación/edición de un sub-recurso ligado (perfil de motorizado) desde el formulario del recurso dueño (Usuario)**: dos llamadas HTTP secuenciales orquestadas en la página (`UsuariosService` → `MotorizadosService`), sin un endpoint combinado nuevo — mismo criterio de la sección 27 (la acción principal, ya irreversible, no se revierte si el sub-recurso falla; se informa el error puntual y se permite completarlo después).
- **Filtro Activos/Inactivos/Todos**: cuando un listado necesita este tri-estado sobre un campo booleano, usar `type: 'select'` de `ResourceTable` con `options: [{value:'true',...},{value:'false',...}]` e `initialValue` para el default — el `placeholder` de la opción "sin filtro" hace de tercer estado ("Todos"), sin necesidad de un mecanismo nuevo.

## 34. Referencias

- `Backend/API_OVERVIEW.md` — endpoints, casos de uso, flujo del negocio.
- `Backend/ARCHITECTURE.md` — arquitectura y decisiones técnicas del backend.
- `Backend/DEVELOPMENT_PROGRESS.md` — historial completo de decisiones y ambigüedades resueltas por fase.
- `FRONTEND_PROGRESS.md` — historial de decisiones y trabajo de este proyecto, se actualiza al final de cada fase.
