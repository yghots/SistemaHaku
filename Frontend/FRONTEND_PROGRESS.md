# HAKU Courier — Frontend — Registro de Desarrollo

## Fase 1 — Inicialización, Arquitectura e Infraestructura del Frontend

**Fecha:** 2026-07-13

### Alcance de esta fase

Infraestructura del proyecto exclusivamente. No se implementó ninguna pantalla de negocio (login, dashboard, usuarios, tiendas, sucursales, clientes, motorizados, pedidos, reportes), no se consumió la API, y no se avanzó a la Fase 2.

### Análisis previo realizado

- Se leyó `Documentacion_HAKU_Courier(1).docx` (documentación funcional completa: roles, flujo de negocio, 20 casos de uso, modelo de 8 tablas, historial de cambios) y el diagrama entidad-relación (`haku_courier_esquema_base_de_datos.png`) — ambos consistentes entre sí y con `Backend/prisma/schema.prisma`.
- Se revisó el backend completo (ya construido en 12 fases previas): `Backend/API_OVERVIEW.md`, `Backend/ARCHITECTURE.md`, `Backend/DEVELOPMENT_PROGRESS.md`, y el propio código fuente.

**Inconsistencias encontradas entre documentación funcional y backend implementado** (reportadas antes de escribir código, no bloquean esta fase, relevantes para cuando se construyan las pantallas de Pedidos/Tiendas/Motorizados en fases futuras):

1. **CU14** dice que las tiendas "se autocrean con el primer pedido". El backend no lo implementa: `POST /pedidos` exige un `sucursalId` ya existente (404 si no existe). El frontend deberá decidir, en la fase de Pedidos, si ofrece creación rápida inline o exige pre-registrar tienda/sucursal.
2. **CU15** dice que los motorizados "se autoregistran". Es parcialmente cierto: `POST /auth/register` crea la cuenta (usuario con rol motorizado) por autoservicio, pero el perfil operativo (placa/estado) requiere una llamada separada a `POST /perfiles-motorizados`. El frontend deberá modelar esto como un flujo de dos pasos.

### Decisiones de arquitectura consultadas y aprobadas

1. **Patrón de componentes**: funciones factory en TypeScript que devuelven `HTMLElement` real (`function Button(props): HTMLButtonElement`), en vez de template strings + `innerHTML` o Web Components. Elegido por compatibilidad directa con Tailwind (sin fricción de Shadow DOM), tipado fuerte del elemento devuelto, y referencia directa al nodo para atar eventos sin volver a consultar el DOM.
2. **Alcance de componentes de esta fase**: solo primitivos sin datos (`Button`, `Input`, `Card`, `Badge`, `Loader`, `Modal`, wrappers de SweetAlert2). `DataTable`, `Pagination`, `SearchBar`, `Select`, `Dropdown`, `Sidebar`, `Navbar`, `Breadcrumb`, `Checkbox`, `Textarea`, `Tooltip` quedan con su carpeta creada pero vacía, para implementarse cuando una pantalla real (Fase 2+) defina su API exacta.

### Dependencias instaladas

- **Runtime**: `axios`, `dayjs`, `lucide`, `sweetalert2`.
- **Build/dev**: `vite`, `typescript`, `@tailwindcss/vite`, `tailwindcss`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, `globals`, `prettier`, `@types/node`.

Versiones relevantes: Vite 8.1.4, TypeScript ~6.0, Tailwind CSS v4.3.2 (config CSS-first, sin `tailwind.config.js`), ESLint 10 (flat config), axios 1.18.1, sweetalert2 11.26, dayjs 1.11.

### Estructura creada

Proyecto Vite (`template vanilla-ts`) en `Frontend/` (en Windows, filesystem case-insensitive: `frontend/` y `Frontend/` son la misma carpeta). Estructura completa de `src/` creada según el árbol pedido (`assets/`, `components/` con las 19 subcarpetas + `icon/` adicional, `layouts/{admin,rider,auth}/`, `pages/admin/{dashboard,usuarios,tiendas,sucursales,clientes,motorizados,pedidos,reportes}/`, `pages/rider/{dashboard,mis-pedidos,pedido,historial,perfil}/`, `router/`, `services/`, `config/`, `constants/`, `styles/`, `types/`, `utils/`, `hooks/`). Las carpetas de `pages/` quedan vacías a propósito (ninguna pantalla se implementa esta fase).

Se agregó `components/icon/` (no estaba en la lista original) como único punto de entrada para renderizar iconos de Lucide, consistente con la regla de "un solo componente por responsabilidad" — cualquier icono en el proyecto pasa por `Icon()`.

### Configuración realizada

- **Vite** (`vite.config.ts`): plugin `@tailwindcss/vite`, alias de imports (`@`, `@components`, `@layouts`, `@pages`, `@router`, `@services`, `@config`, `@constants`, `@types`, `@utils`, `@hooks`, `@styles`, `@assets`), puerto fijo `5173` (coincide con `CORS_ORIGIN=http://localhost:5173` ya configurado en el backend desde la Fase 10).
- **TypeScript** (`tsconfig.json`): `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, mismos alias que Vite. `tsconfig.node.json` separado (solo para que ESLint pueda tipar `vite.config.ts`/`eslint.config.js` con tipos de Node, sin mezclarlos con el `tsconfig.json` de la app).
- **Tailwind CSS v4** (`src/styles/index.css`): config CSS-first vía `@theme` — paleta `brand`/`success`/`warning`/`danger`/`info` (provisional: no hay colores de marca definidos en la documentación todavía; cambiar únicamente aquí cuando se definan, sin tocar componentes).
- **ESLint** (`eslint.config.js`, flat config): `typescript-eslint` con reglas type-checked, `eslint-config-prettier` para no chocar con Prettier.
- **Prettier** (`.prettierrc.json`): comillas simples, ancho 100, trailing commas.
- **Variables de entorno**: `.env` / `.env.example` con `VITE_API_BASE_URL`, `VITE_API_TIMEOUT_MS`, `VITE_APP_NAME`. Lectura centralizada y tipada en `src/config/env.ts` (único punto de acceso a `import.meta.env`).
- **Scripts** (`package.json`): `dev`, `build` (`tsc && vite build`), `preview`, `typecheck`, `lint`, `lint:fix`, `format`, `format:check`.

### Cliente HTTP

`src/services/http/http-client.ts`: instancia de Axios con `baseURL`/`timeout` desde `config/env.ts`. Interceptor de request preparado para JWT (`src/services/http/auth-token.ts`, hoy devuelve `null` — placeholder documentado explícitamente para cuando el backend implemente JWT). Interceptor de response normaliza cualquier error a la clase `HttpError` (`src/services/http/http-error.ts`), reflejando exactamente la forma del error del backend (`statusCode`, `path`, `method`, `message`) o un error de red/timeout genérico. No se consumió ningún endpoint real.

### Layouts creados

`AuthLayout`, `AdminLayout`, `RiderLayout` (`src/layouts/`) — estructura base únicamente (contenedor centrado para Auth; sidebar + topbar + área de contenido para Admin; topbar + contenido + espacio para navegación inferior para Rider). Todos devuelven `{ element, mount }`: `element` se inserta en `#app`, `mount` es donde el router monta cada página.

### Componentes creados

`Button` (5 variantes, 3 tamaños, loading, icono), `Input` (label, error, help text, handle con `setError`), `Card` (título/subtítulo/acciones de header/footer), `Badge` (6 variantes semánticas), `Loader` (spinner), `Modal` (shell con apertura/cierre, backdrop, Escape, bloqueo de scroll), `Icon` (wrapper de Lucide), `alert` (`confirmDialog`, `infoAlert`) y `toast` (`showSuccessToast/ErrorToast/InfoToast/WarningToast`), ambos sobre SweetAlert2.

### Router

`src/router/router.ts`: router SPA mínimo basado en History API, sin dependencias externas. Soporta parámetros de ruta (`:id`), intercepta clicks en `<a data-link>` para navegación sin recarga, y limpieza (`cleanup`) entre páginas. No se registró ninguna ruta de negocio — `main.ts` registra un único placeholder en `/` para verificar que toda la infraestructura funciona junta.

### Verificaciones ejecutadas

`npm install` ✓ · `npx tsc --noEmit` ✓ · `npx eslint .` ✓ (0 errores) · `npx prettier --check .` (formateado con `--write`) ✓ · `npm run build` ✓ (bundle generado, 86.7 kB JS / 45.9 kB CSS sin gzip) · smoke test del dev server (`npm run dev`, verificado que `index.html` y `main.ts` se sirven con 200 y sin errores de transformación). No se realizó verificación visual en navegador real (no hay herramienta de automatización de navegador disponible en este entorno) — se recomienda abrir `http://localhost:5173` manualmente para confirmar el renderizado antes de continuar.

### Problemas técnicos encontrados y resueltos durante la configuración

- TypeScript ~6.0 deprecó `baseUrl` en `tsconfig.json`; se resolvió usando rutas relativas (`./src/*`) en `paths` sin declarar `baseUrl`.
- ESLint con `parserOptions.project` no podía tipar `vite.config.ts` ni `eslint.config.js` (fuera del `include` de `tsconfig.json`, y en el caso de `eslint.config.js`, un archivo `.js`). Se resolvió con un `tsconfig.node.json` separado (con `allowJs: true`) referenciado como segundo proyecto en `eslint.config.js`, sin tocar el `tsconfig.json` de la app ni el pipeline de build real.
- `lucide` (paquete vanilla, no `lucide-react`) expone `createElement(iconNode, attrs): SVGElement` — verificado en sus tipos antes de construir el wrapper `Icon`, en vez de asumir la API.
- El helper `el()` inicial asignaba todos los atributos como propiedades JS (`element[key] = value`), lo que no refleja correctamente atributos ARIA con guion (`aria-label`, `aria-modal`) en todos los navegadores. Se corrigió para que las claves con guion (y `role`) usen `setAttribute` en vez de asignación de propiedad.

### Trabajo pendiente (explícitamente fuera de esta fase)

- Todas las pantallas de negocio (Admin y Rider).
- Consumo real de la API (servicios por módulo).
- Componentes que dependen de una pantalla real para definir su API: `DataTable`, `Pagination`, `SearchBar`, `Select`, `Dropdown`, `Sidebar` (contenido real), `Navbar` (contenido real), `Breadcrumb`, `Checkbox`, `Textarea`, `Tooltip`.
- Definición de la identidad visual de marca real (la paleta `brand-*` actual es un placeholder neutro-profesional).
- Resolución de las 2 inconsistencias documentadas entre CU14/CU15 y el backend implementado.
- Autenticación real (login funcional, manejo de sesión) — el interceptor JWT está preparado pero no implementado, a la espera de que el backend lo incorpore.

**No se avanza a la Fase 2 sin autorización explícita.**

## Fase 2 — Design System, Dashboard Base y Navegación

**Fecha:** 2026-07-13

### Alcance de esta fase

Design System oficial, layouts completos (Navbar + Sidebar + área principal + Footer), navegación completa (todas las rutas del Sidebar registradas, apuntando a placeholders donde no hay pantalla real todavía) y el Dashboard visual del panel Administrativo, con datos simulados. Sin consumo de API, sin servicios nuevos, sin pantallas funcionales de negocio, sin login/JWT, sin formularios CRUD — tal como se pidió.

### Decisión de arquitectura consultada y aprobada

El brief pedía que los 3 layouts (Admin, Rider, Auth) llevaran Navbar + Sidebar + área principal + Footer. Se identificó como inconsistencia: `AuthLayout` es para pantallas sin sesión (login), donde un Sidebar con enlaces a Dashboard/Usuarios/Pedidos no tiene sentido (esas rutas no son navegables antes de autenticarse, y el login no se implementa todavía). Se aprobó: `AuthLayout` lleva un header mínimo (logo + cambio de tema) y Footer, **sin Sidebar**; `AdminLayout` y `RiderLayout` sí llevan los 4 elementos completos.

### Design System implementado

- **Temas claro/oscuro**: estrategia por clase (`@custom-variant dark` de Tailwind v4, no solo `prefers-color-scheme`), toggle + persistencia en `localStorage` (`src/utils/theme.ts`), default claro, sin parpadeo (`initTheme()` se ejecuta antes de montar nada).
- **Colores**: tokens semánticos de layout (`surface`, `surface-elevated`, `surface-muted`, `border-default`, `text-primary/secondary/muted`) que cambian de valor entre temas sin cambiar el nombre de clase usado en los componentes; colores de acento (`brand`, `success`, `warning`, `danger`, `info`) con variantes `dark:` puntuales. Paleta neutra-profesional inspirada en Stripe/GitHub/Vercel (sin colores saturados) — sigue siendo provisional hasta que exista una identidad de marca real.
- **Tipografía**: Inter autoalojada vía `@fontsource/inter`, limitada a los subconjuntos `latin`/`latin-ext` (suficientes para español) para no inflar el bundle con ~15 subconjuntos de idioma innecesarios (reducción de ~600 KB a ~280 KB de fuentes en el build de producción).
- **Espaciados, radios, sombras**: tokens `--radius-sm/md/lg/xl` y `--shadow-xs/sm/md/lg` centralizados en `@theme`, sombras deliberadamente sutiles.
- **Breakpoints**: estándar de Tailwind; `lg` como umbral desktop/tablet para el Sidebar.
- **Tamaños de icono/botón/input** y **estados visuales** (hover/focus-visible/disabled/loading): documentados y unificados en `CLAUDE.md` sección 7.
- **Animaciones**: únicamente transiciones de color/opacidad/transform de 150–200ms (hover, Sidebar, Dropdown, Modal, cambio de tema), sin animaciones llamativas.

Todo el detalle completo de estos tokens y convenciones quedó documentado en `CLAUDE.md` (sección 7, "Design System oficial").

### Componentes creados en esta fase

`IconButton`, `Textarea`, `Select`, `Checkbox`, `SearchBar`, `DataTable`, `Pagination`, `EmptyState`, `Avatar`, `Breadcrumb`, `Dropdown`, `Tooltip`, `StatCard`, `Section`, `PageHeader`, `Skeleton`, `Navbar`, `Sidebar`, `Footer`. "ConfirmDialog" no se creó como componente nuevo: ya estaba resuelto desde la Fase 1 por `confirmDialog()` (SweetAlert2) — crear uno adicional habría sido duplicar funcionalidad existente.

Se agregó `src/utils/field-chrome.ts` (no estaba en el plan original) al notar que `Input`, `Textarea` y `Select` iban a repetir exactamente el mismo markup de label/help-text/error: se extrajo a un helper compartido antes de escribir el tercer campo (regla de no duplicar código).

Componentes de la Fase 1 actualizados para soportar ambos temas: `Button`, `Input`, `Card`, `Badge`, `Modal`. `Loader` no necesitó cambios (ya usaba `border-current`, hereda el color de su contexto).

### Layouts completados

- **AdminLayout**: Sidebar (9 items: Dashboard, Usuarios, Tiendas, Sucursales, Clientes, Motorizados, Pedidos, Reportes, Configuración) + Navbar + área principal + Footer.
- **RiderLayout**: Sidebar (4 items: Dashboard, Mis pedidos, Historial, Perfil) + Navbar + área principal + Footer. Mismos componentes que AdminLayout, distinto arreglo de items — sin duplicar código de layout.
- **AuthLayout**: header mínimo + área centrada + Footer, sin Sidebar (ver decisión aprobada arriba).

`Sidebar` es colapsable (botón propio, ancho animado `transition-all duration-200`, estado persistido en `localStorage` con una clave distinta por panel) y usa `Tooltip` para mostrar la etiqueta de cada item cuando está colapsado. `Navbar` incluye logo, slot de breadcrumb (se actualiza por ruta), `SearchBar` (solo interfaz), toggle de tema, botón de notificaciones (placeholder con indicador) y menú de usuario (`Dropdown` + `Avatar`, items deshabilitados a propósito — sin funcionalidad conectada).

### Navegación y rutas registradas

Router extendido (`src/router/router.ts`) con metadatos por ruta (`title`, `breadcrumb`) y un mecanismo `onRouteChange` para que el layout activo actualice el `document.title`, el breadcrumb del Navbar y el item activo del Sidebar en cada navegación.

Rutas registradas:

- **Admin**: `/admin/dashboard` (Dashboard real), `/admin/usuarios`, `/admin/tiendas`, `/admin/sucursales`, `/admin/clientes`, `/admin/motorizados`, `/admin/pedidos`, `/admin/reportes`, `/admin/configuracion` (placeholder).
- **Rider**: `/rider/dashboard`, `/rider/mis-pedidos`, `/rider/historial`, `/rider/perfil` (todas placeholder).

`src/pages/placeholder-page.ts` es la página compartida (PageHeader + EmptyState) para toda ruta sin pantalla real todavía — evita crear 13 archivos de página vacíos.

**Limitación conocida y documentada**: sin login/sesión, el panel (Admin vs. Rider) se decide una única vez al cargar la página, según el prefijo de la URL (`/rider/*` → RiderLayout, cualquier otra → AdminLayout). Cada panel solo registra sus propias rutas. No existe todavía un mecanismo de cambio de panel dentro de una misma sesión de navegación (se resolverá naturalmente cuando exista autenticación real con rol).

### Dashboard construido

`src/pages/admin/dashboard/dashboard.page.ts` + `dashboard.mock-data.ts`. Incluye:

- 4 tarjetas KPI (`StatCard`): Pedidos hoy, Pedidos pendientes, Motorizados activos, Entregas completadas (con indicador de tendencia).
- Pedidos recientes: `DataTable` con columnas Código/Cliente/Tienda/Estado (`Badge`)/Fecha.
- Actividad reciente: lista con icono + descripción + tiempo relativo (`dayjs().fromNow()`).
- Accesos rápidos: 4 tarjetas-enlace a Pedidos/Motorizados/Tiendas/Usuarios.
- Aviso visible ("Datos de ejemplo — este panel todavía no está conectado a la API") para que quede claramente identificado como temporal, además de que todos los datos viven en constantes `MOCK_*` en un archivo separado.

### Configuración global de Day.js

`src/config/dayjs.ts`: registra el plugin `relativeTime` y el locale `es`, importado una sola vez (efecto secundario) al inicio de `main.ts`. Necesario para el `.fromNow()` usado en "Actividad reciente".

### Archivos modificados/creados (resumen)

- `src/styles/index.css` (Design System completo, dark mode, fuentes).
- `src/utils/theme.ts`, `src/utils/field-chrome.ts` (nuevos).
- `src/components/*` (18 componentes nuevos + 5 actualizados, ver arriba).
- `src/layouts/{admin,rider,auth}/*` (reescritos).
- `src/router/router.ts` (extendido con metadatos y `onRouteChange`).
- `src/pages/placeholder-page.ts`, `src/pages/admin/dashboard/*` (nuevos).
- `src/config/dayjs.ts` (nuevo).
- `src/main.ts` (reescrito: theming, layout por panel, registro completo de rutas).
- `package.json` (nueva dependencia: `@fontsource/inter`).

### Problemas técnicos encontrados y resueltos

- **Bug real detectado y corregido antes de terminar**: el toggle de tema en `Navbar` tenía una expresión sin sentido para intercambiar el icono sol/luna (`iconWrapper?.replaceWith((theme === 'dark' ? Sun : Moon) && themeToggle.firstElementChild ? ... : ...)`, un no-op disfrazado). Se corrigió construyendo explícitamente el nuevo ícono y reemplazando el nodo anterior.
- **Bug de re-entrancia evitado**: la primera versión de la redirección de `/` al dashboard por defecto llamaba `router.navigate(...)` _dentro_ del callback de render de esa misma ruta, lo que re-entraba en `render()` mientras la llamada externa seguía en el stack y terminaba pisando el `cleanup` y los listeners de `onRouteChange` de la ruta real recién montada. Se resolvió haciendo el redirect con `history.replaceState` **antes** de construir el router, evitando la re-entrancia por completo.
- **Bundle de fuentes excesivo**: importar `@fontsource/inter/400.css` (etc.) por defecto empaqueta los ~16 subconjuntos de idioma de Inter (~600 KB). Se cambió a los imports específicos `latin-*.css`/`latin-ext-*.css`.
- `Select` inicialmente pasaba las clases de error/normal al `<div>` contenedor en vez de al `<select>` real (por envolver el control en un div para el ícono del chevron). Se corrigió agregando un parámetro `errorTarget` opcional a `FieldChrome`, distinto del `control` insertado.
- Un `Skeleton` con `width`/`height` no proporcionados asignaba literalmente el string `"undefined"` como valor de estilo (vía `Object.assign` sobre `CSSStyleDeclaration`). Se corrigió construyendo el objeto `style` solo con las claves definidas.

### Verificaciones ejecutadas

`npx tsc --noEmit` ✓ · `npx eslint .` ✓ (0 errores) · `npx prettier --check .` ✓ · `npm run build` ✓. Smoke test del dev server (sin herramienta de navegador disponible en este entorno, igual que en la Fase 1): verificado por HTTP que `index.html` y los módulos TypeScript se sirven correctamente sin errores de transformación. Se recomienda abrir la app manualmente para verificar el renderizado visual, el toggle de tema y la navegación del Sidebar antes de continuar.

### Trabajo pendiente (explícitamente fuera de esta fase)

- Todas las pantallas de negocio reales (Usuarios, Tiendas, Sucursales, Clientes, Motorizados, Pedidos, Reportes, Configuración, Mis Pedidos, Historial, Perfil) — hoy son placeholders.
- Login funcional y manejo de sesión real (determinará el panel activo en vez del prefijo de URL).
- Definición de la identidad visual de marca real (la paleta `brand-*` sigue siendo un placeholder).
- Resolución de las 2 inconsistencias CU14/CU15 documentadas en la Fase 1.
- Optimización para móviles (explícitamente fuera de alcance esta fase).

**No se avanza a la Fase 3 sin autorización explícita.**

## Fase 3 — Autenticación, Sesión e Integración Inicial con el Backend

**Fecha:** 2026-07-13

### Alcance de esta fase

Login funcional consumiendo `POST /auth/login` (el único endpoint del backend usado esta fase), `SessionService`, `AuthService`, Logout, protección básica del router, redirección automática por rol, e integración de esos flujos con los layouts/Dashboard ya construidos. Sin JWT, sin refresh token, sin OAuth, sin recuperación de contraseña, sin CRUD — tal como se pidió.

### Limitación de seguridad documentada (no bloqueante, inherente al alcance pedido)

El backend (Feature Freeze) no emite ningún token: `POST /auth/login` devuelve únicamente `{ usuario: {...} }`. Por lo tanto, la "sesión" del frontend es el objeto `usuario` guardado en `localStorage` por `SessionService`, **sin ningún mecanismo de validación server-side por request** — no hay forma de que el backend confirme que quien hace una petición realmente inició sesión, y cualquier persona con acceso a las devtools del navegador podría escribir manualmente un objeto de sesión falso en `localStorage` y obtener acceso visual a un panel sin haberse autenticado (aunque, al no haber CRUD implementado todavía, hoy no hay ninguna operación de negocio real que esa persona pudiera ejecutar contra el backend). Esta limitación es inherente a la decisión explícita del brief ("la autenticación deberá funcionar exactamente con el backend existente", sin JWT) y se resuelve naturalmente cuando el backend incorpore JWT — la arquitectura ya quedó preparada para ese reemplazo (ver `CLAUDE.md`, sección 11) tocando únicamente `SessionService` y `auth-token.ts`.

### Archivos creados

- `src/types/auth.ts` — `AuthUser`, `UserRole`, `LoginResponse`. Reflejan exactamente `UsuarioResponseDto`/`AuthResponseDto` del backend (id, usuario, correo, rol, activo) — sin token, sin propiedades inventadas.
- `src/constants/roles.ts` — `DEFAULT_PATH_BY_ROLE` (mapeo rol → ruta por defecto), usado por `LoginPage` y por `main.ts`.
- `src/services/session.service.ts` — `SessionService` (`saveSession`, `getCurrentUser`, `updateSession`, `hasSession`, `clearSession`). Único punto de acceso a `localStorage` para sesión en todo el proyecto.
- `src/services/auth.service.ts` — `AuthService.login()`. Único punto de llamada a `POST /auth/login`.
- `src/router/route-guard.ts` — `withAuth()`, envuelve cualquier `RouteRenderer` para exigir `SessionService.hasSession()` antes de renderizar.
- `src/utils/logout.ts` — `logout()` (limpia sesión + navega a `/login`), reutilizado por ambos layouts.
- `src/pages/auth/login.page.ts` — pantalla de Login.

### Integración con el backend

Únicamente `POST /auth/login` (`identificador`, `password` → `{ usuario }`). Ninguna otra llamada al backend en esta fase. Verificado contra el backend real (no simulado) que los 3 escenarios de credenciales inválidas (usuario inexistente, contraseña incorrecta, usuario inactivo) devuelven el mismo `401 "Credenciales invalidas"` (diseño anti-enumeración ya implementado en el backend desde su Fase 3) — el frontend no distingue estos casos porque el backend deliberadamente no lo permite.

### SessionService

Responsable exclusivo de guardar/leer/actualizar/eliminar la sesión y de saber si hay un usuario autenticado, tal como se pidió. Ninguna página, layout ni componente accede a `localStorage` directamente — se verificó revisando cada archivo tocado esta fase. Diseñado para que, cuando exista JWT, solo esta clase (y `auth-token.ts`) necesiten cambiar.

### AuthService

Único punto de llamadas HTTP de auth; usa `httpClient` (el cliente centralizado de la Fase 1), nunca axios directo.

### Flujo completo de Login

`LoginPage` (Design System de la Fase 2: `Card`, `Input` extendido con `trailingAction`, `Button` con estado `loading`, `IconButton`, `Icon`): usuario/correo + contraseña con mostrar/ocultar (icono que alterna Eye/EyeOff), validación de campos obligatorios antes de llamar al backend, botón "Ingresar" con loader mientras la petición está en curso. Al autenticar: `SessionService.saveSession(usuario)` y navegación dura al path por defecto del rol (`DEFAULT_PATH_BY_ROLE`). Errores (400/401/404/500, todos ya normalizados por `HttpError`) se muestran con `infoAlert` (SweetAlert2, `icon: 'error'`) — nunca `alert()`.

### Flujo completo de Logout

Ítem "Cerrar sesión" del menú de usuario del `Navbar` (antes deshabilitado en la Fase 2) ahora invoca `onLogout`, que `AdminLayout`/`RiderLayout` conectan a `logout()`: `SessionService.clearSession()` + navegación dura a `/login`. Sin llamada a ningún endpoint (el backend no tiene logout — no hay token que invalidar). `Navbar` en sí no conoce `SessionService`, solo recibe el callback.

### Protección del router y redirección por rol

`main.ts` reescrito con una función `bootstrap()` que decide, antes de montar cualquier layout, qué mostrar según `SessionService.getCurrentUser()` y el path actual:

- `/login` con sesión activa → navega al dashboard del rol (evita mostrar el login de nuevo).
- Cualquier otra ruta sin sesión → navega a `/login`.
- Con sesión: si el rol es `motorizado` y el path es `/admin/*` (o viceversa, `administrador` en `/rider/*`) → navega al dashboard del rol correcto.
- En cualquier otro caso, monta el panel correspondiente.

Adicionalmente, cada ruta registrada en el `Router` de cada panel está envuelta en `withAuth()` (defensa en profundidad para el caso de que la sesión se borre — ej. otra pestaña cierra sesión, o se limpia `localStorage` manualmente — mientras la SPA ya está montada).

### Componentes reutilizados (ninguno nuevo, solo una extensión menor)

`Card`, `Input` (extendido con `trailingAction?: HTMLElement`, útil para cualquier campo futuro con una acción al final, no solo contraseñas), `Button` (estado `loading`, reconstruido en cada cambio de estado en vez de mutarse — mismo patrón ya usado en `Pagination`/`Badge`), `IconButton`, `Icon`, `infoAlert` (SweetAlert2). `Navbar` se extendió con la prop `onLogout` (no es un componente nuevo, es la misma barra de la Fase 2 con su ítem ya wireado).

### Pruebas realizadas

Contra el backend real (`node dist/src/main.js`, MySQL en Docker) y el frontend real (`npm run dev`):

- `POST /auth/login` verificado directamente (curl) para los 6 escenarios: login correcto administrador, login correcto motorizado, usuario inexistente (401), contraseña incorrecta (401), usuario inactivo (401, mismo mensaje genérico que los dos anteriores), body inválido (400 con los mensajes de validación).
- CORS preflight verificado explícitamente para el origen `http://localhost:5173` contra `POST /auth/login` (`Access-Control-Allow-Origin` refleja el origen, credenciales permitidas).
- Servidor de desarrollo del frontend verificado por HTTP: `/`, `/login`, `/admin/dashboard`, `/rider/dashboard` sirven `200`; los módulos `main.ts` y `login.page.ts` se transforman sin error.
- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`, `npm run build` — los cuatro sin errores.

**Limitación de esta verificación**: no hay herramienta de automatización de navegador disponible en este entorno, así que el flujo interactivo completo (click en "Ingresar", ver el SweetAlert2 de error, alternar mostrar/ocultar contraseña, clic en "Cerrar sesión", recargar el navegador y verificar que la sesión persiste, ver el Sidebar/Navbar con el usuario real) **no se verificó visualmente por mí** — se dejaron el backend y el frontend corriendo, con usuarios de prueba ya creados, para que se verifique manualmente:

| Usuario       | Contraseña  | Rol                         | Notas                           |
| ------------- | ----------- | --------------------------- | ------------------------------- |
| `admin_p3`    | `Passw0rd!` | administrador               | → redirige a `/admin/dashboard` |
| `moto_p3`     | `Passw0rd!` | motorizado                  | → redirige a `/rider/dashboard` |
| `inactivo_p3` | `Passw0rd!` | administrador (desactivado) | → `401 Credenciales invalidas`  |

### URL local del servidor

- Frontend: **http://localhost:5173** (`npm run dev`, corriendo).
- Backend: **http://localhost:3000/api/v1** (`node dist/src/main.js`, corriendo; Swagger en `http://localhost:3000/api/docs`).

### Trabajo pendiente (explícitamente fuera de esta fase)

- Todas las pantallas de negocio reales (siguen como placeholders).
- Recuperación de contraseña (no solicitada esta fase).
- JWT/refresh token real (la arquitectura ya está preparada para incorporarlo tocando solo `SessionService`/`auth-token.ts`).
- Página de "Mi perfil" (el ítem del menú de usuario sigue deshabilitado).
- Verificación visual interactiva completa por parte del usuario (ver limitación de pruebas arriba).

**No se avanza a la Fase 4 sin autorización explícita.**

## Fase 4 — Primer Módulo Administrativo: Usuarios

**Fecha:** 2026-07-13

### Alcance de esta fase

Módulo Usuarios completo (listado, crear, editar, ver detalle, activar, desactivar, eliminar lógicamente) construido como **módulo de referencia**: la mayor parte del esfuerzo de esta fase fue construir infraestructura CRUD reutilizable (no específica de Usuarios) para que Tiendas/Sucursales/Clientes/Motorizados/Pedidos/Reportes la reutilicen directamente.

### Decisión técnica resuelta por razonamiento propio (documentada, no bloqueante)

El backend permite filtrar `GET /usuarios` por `usuario` y por `correo` (coincidencia parcial), combinados con AND si se envían ambos. Un único buscador genérico que enviara el mismo término a los dos parámetros casi nunca encontraría resultados reales (el backend no ofrece una búsqueda "OR" entre campos). Se resolvió exponiendo **dos filtros explícitos** (`SearchBar` "Buscar por usuario..." y "Buscar por correo..."), cada uno mapeado 1:1 a su parámetro real — evita inventar una funcionalidad de búsqueda combinada que el backend no soporta, y sienta el patrón para módulos futuros con más de un campo filtrable.

### Contrato del backend revisado antes de escribir tipos

Se leyó directamente el código fuente (no de memoria): `create-usuario.dto.ts`, `update-usuario.dto.ts`, `usuario-response.dto.ts`, `list-usuarios-query.dto.ts`, `usuarios.controller.ts`. Confirmado: `UpdateUsuarioDto` es `PartialType(CreateUsuarioDto)` (todos los campos opcionales, incluida la contraseña); `ListUsuariosQueryDto` solo admite `usuario`/`correo` como filtros (sin filtro por `rol`/`activo`, sin parámetro de orden); `UsuarioResponseDto` nunca expone `deletedAt`.

### Tipos creados

- `src/types/usuario.ts` — `Usuario`, `CreateUsuarioPayload`, `UpdateUsuarioPayload`, `ListUsuariosParams`. Reutiliza `UserRole` de `types/auth.ts` (ya existente) en vez de redefinirlo — mismo enum de rol en todo el proyecto.

### Servicios creados

- `src/services/usuarios.service.ts` — `UsuariosService` (`listar`, `buscarPorId`, `crear`, `actualizar`, `activar`, `desactivar`, `eliminar`), único punto de llamadas HTTP del módulo.

### Infraestructura reutilizable creada (para todos los módulos futuros)

- **`ResourceTable`** (`src/components/resource-table/`): orquesta filtros + `DataTable` + `Pagination` + estados de carga/error/vacío + recarga. Cualquier módulo futuro solo necesita configurar `columns`, `fetchPage` y `filterFields`.
- **`DataTable` mejorado**: se agregó soporte de estado `error` (con botón "Reintentar" opcional vía `onRetry`), que no existía desde la Fase 2. Mejora retrocompatible (props nuevas opcionales, nada roto) que beneficia a cualquier tabla futura.
- **`FormModal`** (`src/components/modal/form-modal.ts`): compone el `Modal` de la Fase 2 con footer Cancelar/Guardar y loading en el submit — único mecanismo de modal de creación/edición para todos los módulos.
- **`RowActions`** (`src/components/datatable/row-actions.ts`): menú de acciones por fila (Dropdown + IconButton), con soporte de ocultar condicionalmente una acción (ej. "Activar" cuando ya está activo).
- **`DetailList`** (`src/components/detail-list/`): pares etiqueta/valor genéricos para cualquier vista "Ver detalle".
- **Patrón de formulario compartido**: `usuario-form.ts` (`buildUsuarioForm({mode, initial})`) es el ejemplo de la convención que documentamos en `CLAUDE.md` para que cada módulo futuro tenga su propio `build<Entidad>Form` con la misma forma (`element` + `validate()`).

Ninguno de estos componentes contiene lógica específica de Usuarios — se verificó explícitamente antes de darlos por terminados.

### Componentes reutilizados sin cambios

`Card` (implícito vía `Modal`), `Button`, `IconButton`, `Icon`, `Input`, `Select`, `Badge`, `PageHeader`, `Breadcrumb`, `Dropdown`, `SearchBar`, `Pagination`, `EmptyState`, `Skeleton`, `confirmDialog`/`infoAlert`, `showSuccessToast`. Ningún componente nuevo específico de Usuarios (ninguna "UsuariosTable", "UsuarioModal", etc.).

### Flujo completo implementado

Listado con 2 filtros + paginación → Crear (modal, validación cliente + manejo de 409/400 del backend) → Editar (mismo formulario, contraseña opcional) → Ver detalle (modal de solo lectura) → Activar/Desactivar (confirmación previa) → Eliminar lógico (confirmación previa, estilo destructivo) → recarga automática del listado tras cada acción exitosa.

### Endpoints consumidos

`GET /usuarios` (con `usuario`/`correo`/`page`/`limit`), `GET /usuarios/:id`, `POST /usuarios`, `PATCH /usuarios/:id`, `PATCH /usuarios/:id/activar`, `PATCH /usuarios/:id/desactivar`, `DELETE /usuarios/:id`. Ninguno nuevo respecto a los ya documentados en `Backend/API_OVERVIEW.md`.

### Pruebas realizadas

Contra el backend real (`node dist/src/main.js`, MySQL en Docker), vía curl reproduciendo exactamente las llamadas que hace `UsuariosService`:

- Listado paginado (`page`/`limit`/`total` correctos).
- Crear usuario correcto (201).
- Crear con usuario duplicado (409 "El nombre de usuario ya esta en uso").
- Crear con correo inválido (400 "correo must be an email").
- Ver detalle (200).
- Editar sin enviar contraseña (200, contraseña no se modifica — verificado en el propio backend desde su Fase 3).
- Desactivar → Activar (200 en ambos, `activo` cambia correctamente).
- Eliminar lógico (200) y confirmación de que el usuario eliminado ya no aparece (`GET /usuarios/:id` → 404 después de eliminar).
- Filtro por `usuario` y filtro por `correo` por separado (ambos devuelven el subconjunto esperado).
- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`, `npm run build` — los cuatro sin errores.
- Servidor de desarrollo del frontend verificado por HTTP: todos los módulos nuevos (`usuarios.page.ts`, `usuario-form.ts`, `resource-table.ts`, `form-modal.ts`, `detail-list.ts`, `row-actions.ts`) se transforman sin error; `/admin/usuarios` sirve `200`.

Se crearon 11 usuarios de prueba en total (además de los 3 de la Fase 3) para poder verificar paginación real (2 páginas con `limit=10`).

**Limitación de esta verificación (igual que en fases anteriores)**: no hay herramienta de automatización de navegador en este entorno, así que la interacción visual completa (clicks en los botones de acción, apertura/cierre de modales, dark mode, responsive, confirmaciones de SweetAlert2) **no se verificó visualmente por mí**. Backend y frontend se dejaron corriendo con datos de prueba para verificación manual.

### URL local del servidor

- Frontend: **http://localhost:5173** (`/admin/usuarios` tras iniciar sesión con `admin_p3` / `Passw0rd!`).
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante. Errores de lint menores durante el desarrollo (callbacks `async` pasados donde se esperaba `void`, una aserción de tipo innecesaria) — corregidos antes de finalizar, sin impacto en el comportamiento.

### Trabajo pendiente (explícitamente fuera de esta fase)

- Todos los demás módulos administrativos (Tiendas, Sucursales, Clientes, Motorizados, Pedidos, Reportes) — ahora tienen infraestructura lista para reutilizar.
- Verificación visual interactiva completa por parte del usuario.

**No se avanza a la Fase 5 sin autorización explícita.**

## Fase 5 — Módulos Administrativos: Tiendas y Sucursales

**Fecha:** 2026-07-13

### Alcance de esta fase

Módulos Tiendas (listado, crear, editar, ver detalle, activar, desactivar, eliminar lógico, filtro por nombre) y Sucursales (listado, crear, editar, ver detalle, eliminar lógico, consulta por tienda) — sin activar/desactivar en Sucursales (el backend no expone esos endpoints ni el campo `activo` para esa entidad). Ambos módulos construidos conjuntamente por su dependencia funcional real.

### Contrato del backend revisado antes de escribir tipos

Se leyó directamente el código fuente de ambos módulos: `create-tienda.dto.ts`, `update-tienda.dto.ts`, `tienda-response.dto.ts`, `list-tiendas-query.dto.ts`, `tiendas.controller.ts`, y sus equivalentes de `sucursales`. Confirmado: `Sucursal` no tiene campo `activo` ni endpoints `/activar`/`/desactivar`; `ListSucursalesQueryDto` admite `tiendaId` (numérico) y `nombre` como filtros; ningún controlador de estos dos módulos exige autenticación (sin `@UseGuards`), igual que el resto del backend en este proyecto.

### Tipos y servicios creados

- `src/types/tienda.ts`, `src/types/sucursal.ts` — reflejan exactamente los DTOs de respuesta (incluye el comentario explícito, en `sucursal.ts`, de que no existe campo `activo`).
- `src/services/tiendas.service.ts` — `TiendasService` (`listar`, `buscarPorId`, `crear`, `actualizar`, `activar`, `desactivar`, `eliminar`).
- `src/services/sucursales.service.ts` — `SucursalesService` (`listar`, `buscarPorId`, `crear`, `actualizar`, `eliminar`; sin `activar`/`desactivar`, a propósito).

### Infraestructura reutilizable extendida (no se creó ningún componente nuevo)

- **`Dropdown`/`RowActions`**: se agregó soporte de items con `href` (navegación SPA vía `data-link`) como alternativa a `onSelect`, para acciones que navegan a otro módulo en vez de ejecutar una mutación (ej. "Ver sucursales" desde una fila de Tiendas). Documentado en `CLAUDE.md`.
- **`ResourceTable`**: `filterFields` ahora acepta una unión discriminada (`type: 'search'` por defecto, o `type: 'select'` con `options` reales y `initialValue` opcional) — usado por el filtro "Tienda" de Sucursales, poblado con datos reales del backend y con soporte para pre-seleccionarse desde la URL (`?tiendaId=`). Documentado en `CLAUDE.md`.

Ambas extensiones son retrocompatibles: ningún módulo existente (Usuarios, Tiendas mismo) tuvo que cambiar su forma de uso.

### Relación Tiendas → Sucursales

- Cada fila de Tiendas tiene la acción "Ver sucursales" (`href: /admin/sucursales?tiendaId=<id>`), que navega a Sucursales con el filtro de tienda ya aplicado.
- El formulario de creación/edición de Sucursales usa un `Select` de tiendas poblado con la lista real obtenida de `TiendasService.listar({ page: 1, limit: 100 })` — nunca datos simulados. La página construye este listado una sola vez al montarse y lo reutiliza tanto para el filtro de la tabla como para el formulario.
- **Limitación documentada (no bloqueante)**: el selector de tiendas usa una sola página de hasta 100 resultados (el máximo que permite `PaginationQueryDto` del backend). Si en el futuro existieran más de 100 tiendas, este selector necesitaría paginación/búsqueda propia — no implementado ahora porque no fue solicitado y sería alcance no pedido para esta fase.
- La columna "Tienda" del listado de Sucursales resuelve el nombre mediante un mapa `tiendaId → nombre` construido a partir de la misma lista real, en vez de mostrar el id crudo.

### Componentes reutilizados sin cambios

`Button`, `IconButton`, `Icon`, `Input`, `Select`, `Checkbox`, `Badge`, `PageHeader`, `Breadcrumb`, `Modal`, `FormModal`, `DetailList`, `DataTable`, `Pagination`, `SearchBar`, `EmptyState`, `Skeleton`, `Loader`, `confirmDialog`/`infoAlert`, `showSuccessToast`. Ningún componente específico de Tiendas o Sucursales.

### Flujo completo implementado

- **Tiendas**: listado con filtro por nombre + paginación → Crear → Editar → Ver detalle → Activar/Desactivar → Eliminar lógico → "Ver sucursales" (navega a Sucursales filtrado) → recarga automática tras cada acción.
- **Sucursales**: listado con filtro por tienda (real) + filtro por nombre + paginación → Crear (con selector de tienda real) → Editar → Ver detalle → Eliminar lógico → recarga automática tras cada acción. Sin activar/desactivar (no soportado por el backend).

### Endpoints consumidos

`GET/POST/PATCH/DELETE /tiendas`, `PATCH /tiendas/:id/activar`, `PATCH /tiendas/:id/desactivar`, `GET/POST/PATCH/DELETE /sucursales`. Ninguno nuevo respecto a los ya documentados en `Backend/API_OVERVIEW.md`.

### Pruebas realizadas

Contra el backend real, vía curl reproduciendo exactamente las llamadas que hacen `TiendasService`/`SucursalesService`:

- Crear tienda (201), crear tienda duplicada por nombre (409), crear tienda con nombre vacío (400).
- Crear sucursal ligada a una tienda real (201), listar sucursales filtrando por `tiendaId` (devuelve solo las de esa tienda).
- Desactivar tienda → Activar tienda (200 en ambos, `activo` cambia correctamente).
- Eliminar sucursal (200) y confirmación de `GET /sucursales/:id` → 404 después de eliminar.
- Eliminar tienda (200) y confirmación de `GET /tiendas/:id` → 404 después de eliminar.
- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` (formateado con `--write`), `npm run build` — los cuatro sin errores.
- Servidor de desarrollo del frontend verificado por HTTP: todos los módulos nuevos (`tiendas.page.ts`, `tienda-form.ts`, `sucursales.page.ts`, `sucursal-form.ts`, ambos servicios, `main.ts`) se transforman sin error; `/admin/tiendas` y `/admin/sucursales` sirven `200`.

Los datos de prueba creados durante la verificación (1 tienda, 1 sucursal) se eliminaron al finalizar para no dejar residuos en la base de datos.

**Limitación de esta verificación (igual que en fases anteriores)**: no hay herramienta de automatización de navegador en este entorno, así que la interacción visual completa (clicks, apertura/cierre de modales, navegación "Ver sucursales" → filtro pre-aplicado, dark mode, responsive) **no se verificó visualmente por mí**. Backend y frontend se dejaron corriendo para verificación manual.

### URL local del servidor

- Frontend: **http://localhost:5173** (`/admin/tiendas` y `/admin/sucursales` tras iniciar sesión con `admin_p3` / `Passw0rd!`).
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante. Un error de tipos entre el filtro de `tiendaId` (string, viene de un `Select`) y el parámetro `tiendaId` del backend (number) en `SucursalesService.listar` — corregido convirtiendo explícitamente con `Number(...)` antes de la llamada, sin afectar el resto del contrato.

### Trabajo pendiente (explícitamente fuera de esta fase)

- Módulos restantes: Clientes, Motorizados, Pedidos, Reportes, Configuración.
- Selector de tiendas con paginación/búsqueda propia si en el futuro superan 100 registros.
- Verificación visual interactiva completa por parte del usuario.

**No se avanza a la Fase 6 sin autorización explícita.**

## Fase 6 — Módulos Administrativos: Clientes y Motorizados

**Fecha:** 2026-07-13

### Alcance de esta fase

Módulo Clientes completo (listado, crear, editar, ver detalle, eliminar lógico, filtros) y módulo Motorizados completo (listado, crear perfil, editar perfil, ver detalle, eliminar, filtros, búsqueda) sobre la infraestructura ya existente. Sin tocar arquitectura, Design System ni autenticación.

### Contrato del backend revisado antes de escribir tipos

Se leyó directamente el código fuente de ambos módulos: `create-cliente.dto.ts`, `update-cliente.dto.ts`, `cliente-response.dto.ts`, `list-clientes-query.dto.ts`, `clientes.controller.ts`, y sus equivalentes de `perfiles-motorizados` (el recurso real detrás de "Motorizados": `create-perfil-motorizado.dto.ts`, `update-perfil-motorizado.dto.ts`, `perfil-motorizado-response.dto.ts`, `list-perfiles-motorizados-query.dto.ts`, `perfiles-motorizados.controller.ts`) y el enum `EstadoMotorizado` (`disponible`/`ocupado`/`inactivo`) de `prisma/schema.prisma`. Confirmado: `Cliente` no tiene campo `activo` (sin activar/desactivar, igual que Sucursal); `UpdatePerfilMotorizadoDto` excluye explícitamente `usuarioId` (`OmitType`) — el usuario asociado a un perfil es inmutable tras la creación.

### Decisión técnica resuelta por razonamiento propio (documentada, no bloqueante)

"Motorizados" en el backend no es un módulo propio: es el perfil operativo (`/perfiles-motorizados`) de un `Usuario` ya existente con `rol: 'motorizado'` (`usuarioId` obligatorio y numérico en la creación). El backend no expone un filtro por `rol` en `GET /usuarios` (confirmado desde la Fase 4: `ListUsuariosQueryDto` solo admite `usuario`/`correo`). Se resolvió reutilizando `UsuariosService.listar({ page: 1, limit: 100 })` ya existente (mismo límite máximo de paginación usado para el selector de Tiendas en la Fase 5) y filtrando client-side por `rol === 'motorizado'` para poblar el selector de usuario del formulario "Crear perfil" — mismo patrón arquitectónico ya aprobado en la Fase 5 para el selector de tiendas en Sucursales, aplicado aquí sin inventar ningún filtro nuevo en el backend. En modo edición, el campo de usuario se muestra de solo lectura (`Input disabled`) en vez de un `Select`, reflejando fielmente que el backend no permite cambiar `usuarioId` tras la creación.

### Tipos y servicios creados

- `src/types/cliente.ts`, `src/types/perfil-motorizado.ts` (incluye `EstadoMotorizado` como tipo compartido del módulo).
- `src/services/clientes.service.ts` — `ClientesService` (`listar`, `buscarPorId`, `crear`, `actualizar`, `eliminar`; sin activar/desactivar).
- `src/services/motorizados.service.ts` — `MotorizadosService` (`listar`, `buscarPorId`, `crear`, `actualizar`, `eliminar`), consume `/perfiles-motorizados` (nombre real del recurso; el archivo se llama `motorizados.service.ts` porque es el nombre de módulo que ve el usuario final, sin inventar un tercer nombre).

### Infraestructura nueva creada (mínima, pensada explícitamente para Pedidos)

- **`src/utils/select-options.ts`** (`toSelectOptions`): extrae el `.map(item => ({ value, label }))` que ya se repetía al poblar el selector de Tiendas en Sucursales (Fase 5) y que se repite ahora para el selector de usuarios-motorizado — tercera repetición prevista en Pedidos (selects de cliente/motorizado). Utilidad pura de una sola función, sin estado ni dependencias de UI más allá del tipo `SelectOption`.

Ningún otro componente/infraestructura nuevo: `ResourceTable`, `FormModal`, `RowActions`, `DetailList`, `DataTable`, `Pagination`, `SearchBar`, `Modal`, `confirmDialog`, `Loader`, `EmptyState`, `Skeleton`, `PageHeader`, `Breadcrumb`, `Dropdown` se reutilizaron sin ninguna modificación — ya cubrían todo lo necesario para ambos módulos, incluido el filtro `select` de "Estado" en Motorizados (mecanismo ya agregado a `ResourceTable` en la Fase 5).

### Componentes reutilizados sin cambios

`Button`, `IconButton`, `Icon`, `Input`, `Select`, `Badge`, `PageHeader`, `Breadcrumb`, `Modal`, `FormModal`, `DetailList`, `DataTable`, `Pagination`, `SearchBar`, `EmptyState`, `Skeleton`, `Loader`, `confirmDialog`/`infoAlert`, `showSuccessToast`, `ResourceTable` (incluido su filtro `select`, reutilizado tal cual de la Fase 5 para el filtro "Estado" de Motorizados). Ningún componente específico de Clientes o Motorizados.

### Flujo completo implementado

- **Clientes**: listado con 3 filtros (nombre/telefono/documento, separados y explícitos, mismo criterio que Usuarios en la Fase 4) + paginación → Crear → Editar → Ver detalle → Eliminar lógico → recarga automática tras cada acción.
- **Motorizados**: listado con filtro por estado (`select`, 3 valores fijos del enum) + filtro por placa (búsqueda parcial) + paginación → Crear perfil (selector real de usuarios con rol motorizado) → Editar perfil (usuario de solo lectura, solo placa/estado editables) → Ver detalle → Eliminar → recarga automática tras cada acción.

### Endpoints consumidos

`GET/POST/PATCH/DELETE /clientes`, `GET/POST/PATCH/DELETE /perfiles-motorizados`, `GET /usuarios` (reutilizado, ya documentado desde la Fase 4, para poblar el selector de usuarios-motorizado). Ninguno nuevo respecto a los ya documentados en `Backend/API_OVERVIEW.md`.

### Pruebas realizadas

Contra el backend real, vía curl reproduciendo exactamente las llamadas que hacen `ClientesService`/`MotorizadosService`:

- Clientes: crear (201), crear con nombre vacío (400), filtrar por nombre y por teléfono, editar, eliminar (200) y confirmación de `GET /clientes/:id` → 404 después de eliminar.
- Motorizados: verificado que el único usuario con `rol: 'motorizado'` existente (`jeyco`, id 37) no tenía perfil previo; crear perfil (201), crear perfil duplicado para el mismo usuario (409), crear con `estado` inválido (400), editar estado, filtrar por `estado` y por `placa`, eliminar (200) y confirmación de `GET /perfiles-motorizados/:id` → 404 después de eliminar.
- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` (formateado con `--write`), `npm run build` — los cuatro sin errores.
- Servidor de desarrollo del frontend verificado por HTTP: todos los módulos nuevos (`clientes.page.ts`, `cliente-form.ts`, `motorizados.page.ts`, `motorizado-form.ts`, ambos servicios, `select-options.ts`, `main.ts`) se transforman sin error; `/admin/clientes` y `/admin/motorizados` sirven `200`.

Los datos de prueba creados durante la verificación (1 cliente, 1 perfil de motorizado) se eliminaron al finalizar para no dejar residuos en la base de datos.

**Limitación de esta verificación (igual que en fases anteriores)**: no hay herramienta de automatización de navegador en este entorno, así que la interacción visual completa (clicks, apertura/cierre de modales, selector de usuario-motorizado, dark mode, responsive) **no se verificó visualmente por mí**. Backend y frontend se dejaron corriendo para verificación manual.

### URL local del servidor

- Frontend: **http://localhost:5173** (`/admin/clientes` y `/admin/motorizados` tras iniciar sesión con `admin_p3` / `Passw0rd!`).
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante.

### Trabajo pendiente (explícitamente fuera de esta fase)

- Módulo de Pedidos (consumirá `ClientesService`/`MotorizadosService`/`SucursalesService` para sus propios selects/búsquedas, reutilizando `toSelectOptions`).
- Reportes, Configuración.
- Verificación visual interactiva completa por parte del usuario.

**No se avanza a la Fase 7 sin autorización explícita.**

## Fase 7 — Módulo Administrativo: Pedidos

**Fecha:** 2026-07-13

### Alcance de esta fase

CRUD administrativo completo de Pedidos (listado, crear, editar, ver detalle, eliminar, filtros) sobre la infraestructura existente. Explícitamente **no** se implementa el flujo operativo (asignar/reasignar motorizado, confirmar recojo, iniciar ruta, confirmar entrega, cliente ausente, rechazo, cancelación, incidentes) — el backend ya modela esos estados (`EstadoPedido`) pero ningún endpoint de transición se consume esta fase.

### Contrato del backend revisado antes de escribir tipos

Se leyó directamente el código fuente: `create-pedido.dto.ts`, `update-pedido.dto.ts`, `pedido-response.dto.ts`, `list-pedidos-query.dto.ts`, `pedidos.controller.ts`, y el enum `EstadoPedido` (10 valores: `pendiente`, `asignado`, `recogido`, `en_ruta`, `entregado`, `cancelado`, `reprogramado`, `devuelto`, `rechazado`, `cliente_ausente`) de `prisma/schema.prisma`. Confirmado: `sucursalId`, `clienteId` y `creadoPorId` son inmutables tras la creación (`UpdatePedidoDto` los excluye vía `OmitType`); `estado`, `motorizadoActualId` y `codigoPedido` los controla el backend internamente (nunca se envían al crear/editar); `valorProducto`/`costoEnvio` llegan en la respuesta como `string | null` (Decimal serializado por Prisma) aunque se envían como `number` al crear/editar — se verificó explícitamente contra el backend real (`"valorProducto":"25.5"` en la respuesta a un `POST` con `valorProducto: 25.50`). Se verificó también que el backend rechaza con `400` ("property sucursalId should not exist") cualquier intento de enviar un campo inmutable en el `PATCH`, confirmando que la whitelist de validación está activa.

### Tipos y servicio creados

- `src/types/pedido.ts` — `Pedido`, `CreatePedidoPayload`, `UpdatePedidoPayload`, `ListPedidosParams`, `EstadoPedido`.
- `src/services/pedidos.service.ts` — `PedidosService` (`listar`, `buscarPorId`, `crear`, `actualizar`, `eliminar`).

### Decisión técnica resuelta por razonamiento propio (documentada, no bloqueante)

El brief pedía selectores de Cliente, Tienda y Sucursal, pero `creadoPorId` (el usuario administrador que registra el pedido) no aparece en la lista de selectores — coherente con que es un campo de auditoría, no una elección del usuario. Se resolvió tomando `creadoPorId` automáticamente de `SessionService.getCurrentUser()!.id` (el admin con sesión activa) al construir el payload de creación, sin exponer ningún campo ni selector para elegirlo manualmente — ninguna otra interpretación es consistente con "el usuario que registra el pedido" siendo quien está llenando el formulario.

### Arquitectura de selectores dependientes (Tienda → Sucursal)

Siguiendo la instrucción explícita de "priorizar una solución genérica frente a una específica para Pedidos", se extendieron dos piezas de infraestructura ya existente en vez de crear un componente nuevo:

- **`Select` extendido** (`src/components/select/select.ts`): el `SelectHandle` ahora expone `setOptions(options)` (reemplaza las opciones en caliente, preservando el valor actual si sigue existiendo) y `setDisabled(disabled)`. Cambio retrocompatible: ningún uso existente de `Select` (`Usuarios`, `Sucursales`, `Motorizados`, filtros de `ResourceTable`) tuvo que cambiar.
- **`src/utils/dependent-options.ts`** (`createDependentOptionsLoader`): utilidad genérica y sin conocimiento de dominio que cachea las opciones cargadas por valor de "padre" (evita repetir la misma consulta si el usuario vuelve a elegir una tienda ya consultada) y descarta respuestas obsoletas si el padre cambia antes de que la solicitud anterior resuelva (evita condiciones de carrera). No conoce Tiendas ni Sucursales: recibe la función de carga real por parámetro.

`pedido-form.ts` compone ambas piezas: al cambiar la Tienda, deshabilita y vacía el Select de Sucursal, y solo si hay una tienda elegida pide `SucursalesService.listar({ tiendaId })` a través del loader (cacheado por tienda) para poblarlo y habilitarlo — las sucursales nunca se cargan hasta que existe una tienda seleccionada, tal como se pidió. Cliente y Tienda (listas independientes entre sí) se cargan **en paralelo** (`Promise.all`) al abrir el formulario de creación.

### El formulario resuelve sus propios selectores (arquitectura desacoplada)

A diferencia de Sucursales/Motorizados (donde la _página_ precargaba la lista y se la pasaba al formulario), aquí `pedido-form.ts` es completamente autosuficiente: en modo creación llama directamente a `ClientesService`/`TiendasService`/`SucursalesService` para poblar sus propios selectores; en modo edición llama a `ClientesService.buscarPorId`/`SucursalesService.buscarPorId` para resolver el nombre a mostrar de forma solo lectura (Cliente y Sucursal son inmutables tras la creación, igual que `usuarioId` en Motorizados). Cada selector obtiene sus datos exclusivamente de su propio servicio — ningún selector conoce la implementación interna de otro. La página (`pedidos.page.ts`) hace sus propias llamadas independientes a esos mismos servicios, mostrando `codigoPedido`/`Estado`/`Creado`, la caché de nombres del listado y la caché de nombres del formulario son necesidades distintas, no una duplicación (mismo servicio, dos consumidores independientes, sin lógica compartida que extraer).

### Componentes reutilizados sin cambios

`Button`, `IconButton`, `Icon`, `Input`, `Textarea`, `Badge`, `PageHeader`, `Breadcrumb`, `Modal`, `FormModal`, `DetailList`, `DataTable`, `Pagination`, `SearchBar`, `EmptyState`, `Skeleton`, `Loader`, `confirmDialog`/`infoAlert`, `showSuccessToast`, `ResourceTable` (filtros `search` y `select`, ya existentes desde la Fase 5), `toSelectOptions` (Fase 6). Ningún componente específico de Pedidos.

### Flujo completo implementado

Listado con 3 filtros (código, estado, sucursal) + paginación → Crear (Cliente/Tienda/Sucursal cargados y encadenados como se describe arriba, resto de campos con validación cliente) → Editar (Cliente/Sucursal de solo lectura, resto editable) → Ver detalle (montos, estado, fechas formateadas) → Eliminar → recarga automática tras cada acción.

### Endpoints consumidos

`GET/POST/PATCH/DELETE /pedidos`, más `GET /clientes`, `GET /tiendas`, `GET /sucursales` (y `GET /clientes/:id`, `GET /sucursales/:id`), todos ya documentados y reutilizados de fases anteriores. Ninguno nuevo respecto a `Backend/API_OVERVIEW.md`.

### Pruebas realizadas

Contra el backend real, vía curl reproduciendo exactamente las llamadas que hace `PedidosService` (y las que hace `pedido-form.ts` para sus selectores):

- Creación de datos de prueba (tienda, sucursal ligada, cliente) y verificación de que `GET /sucursales?tiendaId=X` (la misma llamada que dispara el selector dependiente) devuelve solo la sucursal de esa tienda.
- Crear pedido (201, estado inicial `pendiente`), crear con dirección vacía (400), crear con sucursal inexistente (404).
- Filtrar por `codigoPedido`, por `estado` y por `sucursalId` (los 3 filtros expuestos en la tabla).
- Editar campos permitidos (200) y confirmación de que el backend rechaza con 400 ("property sucursalId should not exist") un intento de modificar un campo inmutable — congruente con que el formulario de edición nunca envía esos campos.
- Eliminar (200) y confirmación de `GET /pedidos/:id` → 404 después de eliminar.
- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` (formateado con `--write`), `npm run build` — los cuatro sin errores.
- Servidor de desarrollo del frontend verificado por HTTP: todos los módulos nuevos/modificados (`pedidos.page.ts`, `pedido-form.ts`, `pedidos.service.ts`, `types/pedido.ts`, `dependent-options.ts`, `select.ts`, `main.ts`) se transforman sin error; `/admin/pedidos` sirve `200`.

Los datos de prueba creados durante la verificación (1 tienda, 1 sucursal, 1 cliente, 1 pedido) se eliminaron al finalizar para no dejar residuos en la base de datos.

**Limitación de esta verificación (igual que en fases anteriores)**: no hay herramienta de automatización de navegador en este entorno, así que la interacción visual completa (clicks, apertura/cierre de modales, comportamiento en vivo del selector dependiente Tienda→Sucursal, dark mode, responsive) **no se verificó visualmente por mí**. Backend y frontend se dejaron corriendo para verificación manual.

### URL local del servidor

- Frontend: **http://localhost:5173** (`/admin/pedidos` tras iniciar sesión con `admin_p3` / `Passw0rd!`).
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante.

### Trabajo pendiente (explícitamente fuera de esta fase)

- Flujo operativo completo del Pedido (asignar/reasignar motorizado, confirmar recojo, iniciar ruta, confirmar entrega, cliente ausente, rechazo, cancelación, incidentes) — siguiente fase.
- Filtros por rango de fechas (`fechaDesde`/`fechaHasta`, soportados por el backend pero sin control de UI: requerirían un componente de selección de fechas que todavía no existe en el Design System; no se creó uno nuevo para no ampliar el alcance de esta fase).
- Reportes, Configuración.
- Verificación visual interactiva completa por parte del usuario.

## Fase 7 (corrección) — Estabilización del módulo de Pedidos

**Fecha:** 2026-07-13

### Alcance

La Fase 7 se reabrió tras encontrarse errores funcionales en la validación manual. Esta corrección trabaja únicamente sobre el frontend (backend, base de datos y Prisma sin cambios) y cubre los 6 problemas reportados. No se agregó ninguna funcionalidad fuera de lo ya definido en la Fase 7.

### Problema 1 — Modal de Pedidos poco responsive, footer oculto

**Causa raíz**: `src/components/modal/modal.ts` (el `Modal` genérico usado por todo el proyecto) nunca tuvo límite de alto ni scroll interno — el panel crecía con el contenido sin restricción. Ningún formulario anterior (Usuario, Tienda, Sucursal, Cliente, Motorizado) tenía suficientes campos para exponer el problema; el formulario de Pedidos (9 campos: Cliente, Tienda, Sucursal, Direccion, Telefono, Descripcion, Valor, Costo, Observaciones) fue el primero en superar la altura disponible del viewport, empujando el footer (Cancelar/Guardar) fuera de la pantalla sin forma de hacer scroll para alcanzarlo.

**Corrección**: se modificó el componente `Modal` (no se creó una variante para Pedidos, siguiendo la regla de "modificar el reutilizable, no crear otro"): el panel ahora es `flex flex-col` con `max-h-[85vh]`; el header y el footer llevan `shrink-0` (siempre visibles); el contenido central lleva `flex-1 min-h-0 overflow-y-auto` (único bloque que hace scroll interno). Cambio retrocompatible: los modales cortos (Ver detalle, formularios de 2-4 campos) no cambian visualmente, porque nunca llegan a necesitar el scroll.

**Archivo modificado**: `src/components/modal/modal.ts`.

### Problema 2 — Seleccionar un Cliente no completaba campos relacionados

**Causa raíz**: no era un bug sino una funcionalidad no implementada. El propio `create-pedido.dto.ts` documenta que `telefonoContacto` "si no se llena, se usa el del cliente" — el backend ya asume que el frontend puede reutilizar los datos del cliente, pero el formulario no lo hacía.

**Corrección**: `pedido-form.ts` ahora guarda el `Cliente` completo de cada opción (no solo `id`/`label`) en un mapa `clientesById`, y al cambiar la selección de Cliente completa automáticamente **Dirección de entrega** y **Teléfono de contacto** con `cliente.direccion`/`cliente.telefono` — únicamente si esos campos siguen vacíos, para no sobrescribir un valor que el administrador ya haya escrito a mano. No se inventó ningún dato: solo se usan campos que `ClientesService` ya devuelve.

**Archivo modificado**: `src/pages/admin/pedidos/pedido-form.ts`.

### Problema 3 — No se puede crear un Pedido ("no encuentra el usuario")

**Investigación (causa raíz, no síntoma)**: se revisó campo por campo la cadena `SessionService → AuthService → login.page.ts → pedidos.page.ts → PedidosService → CreatePedidoDto → PedidosService.crear (backend) → UsuariosService.buscarPorId`. Todo el código es correcto:

- `AuthService.login()` devuelve exactamente `{ usuario: UsuarioResponseDto }`; `login.page.ts` guarda ese `usuario` (no un objeto envuelto ni transformado) vía `SessionService.saveSession(usuario)`.
- `pedidos.page.ts` calcula `creadoPorId = Number(SessionService.getCurrentUser()?.id)` — mismo nombre de propiedad, misma conversión a `number` que usa el resto del proyecto (Tiendas, Sucursales, Clientes, Motorizados) para ids en payloads de creación.
- El backend (`pedidos.service.ts`) llama `usuariosService.buscarPorId(BigInt(dto.creadoPorId))`, que lanza `NotFoundException('Usuario no encontrado')` si el id no existe — este es exactamente el mensaje reportado.

Se confirmó la causa raíz real verificando el estado de la base de datos: los usuarios `admin_p3`/`moto_p3`/`inactivo_p3` (las credenciales originales documentadas desde la Fase 3, usadas para las pruebas manuales de todas las fases) **ya no existen** — `GET /usuarios` no los lista, y `POST /auth/login` con `admin_p3` devuelve `401`. Fueron eliminados en algún punto de las pruebas manuales de CRUD del módulo Usuarios (Fases 4-6), sin que la sesión activa en el navegador se enterara: el backend no emite JWT y el frontend no revalida la sesión contra el servidor en cada request (limitación de seguridad ya documentada desde la Fase 3, sección 11 de `CLAUDE.md`). El navegador seguía "logueado" con un `id` que ya no corresponde a ningún usuario real — por eso cualquier acción que use ese `id` (como `creadoPorId` al crear un Pedido) recibe `404 Usuario no encontrado`, aunque el resto de la aplicación (que no depende de `creadoPorId`) siga funcionando con normalidad.

**Prueba de la causa raíz (no una suposición)**: se creó una cuenta de prueba nueva y válida (`POST /usuarios`, operación normal de la API ya existente, sin tocar backend/DB/Prisma) y se reprodujo exactamente el flujo del frontend por curl (login → extraer `id` real → crear Pedido con ese `id` como `creadoPorId`) — el pedido se creó correctamente (`201`), confirmando que el código del frontend es 100% correcto y que el problema era exclusivamente una sesión de navegador obsoleta.

**Corrección**: ninguna en el código (no hay ningún bug que corregir — el comportamiento es el esperado dado el diseño de sesión ya aprobado en la Fase 3). Acción práctica: se dejó creada la cuenta `admin_f7` / `Passw0rd!` (rol administrador) para que el usuario cierre sesión (o borre `localStorage`) y vuelva a iniciar sesión con una cuenta que sí existe actualmente en la base de datos. Cualquier cuenta administradora vigente (`adrian`, `p4_user4`…`p4_user8`, o la nueva `admin_f7`) funciona igual de bien: el problema nunca fue de código, fue de datos de sesión desactualizados.

### Problema 4 — Integración Frontend → Backend campo por campo

Revisada explícitamente como parte del Problema 3: `CreatePedidoPayload` (frontend) y `CreatePedidoDto` (backend) coinciden campo por campo en nombre y tipo (`sucursalId`/`clienteId`/`creadoPorId`: number; `direccionEntrega`: string requerido; `telefonoContacto`/`descripcionProducto`/`observaciones`: string opcional; `valorProducto`/`costoEnvio`: number opcional). Se confirmó además que el backend rechaza con `400` ("property sucursalId should not exist") cualquier intento de enviar un campo inmutable en `PATCH /pedidos/:id` — la whitelist de validación (`ValidationPipe` con `forbidNonWhitelisted`) está activa y protege contra payloads con propiedades inventadas.

### Problema 5 — Selectores y dependencia Tienda → Sucursal

**Causa raíz encontrada (bug real, no reportado explícitamente pero detectado al auditar "no deberán mantenerse valores inválidos")**: `utils/dependent-options.ts` (`createDependentOptionsLoader`) tenía un guard contra condiciones de carrera que **no funcionaba**: descartaba la escritura en caché de una respuesta obsoleta, pero igual la **devolvía** a quien la llamó. Si un administrador cambiaba de Tienda dos veces seguidas antes de que la primera consulta de Sucursales terminara, la respuesta más lenta (de la Tienda ya abandonada) podía resolver después de la más rápida y terminar pisando el selector de Sucursal con opciones de la tienda incorrecta — exactamente el síntoma de "valores inválidos" que no se limpian.

**Corrección**: se movió la protección contra respuestas obsoletas al único lugar que realmente puede saber si una respuesta sigue siendo relevante — quien manipula el `Select` (`pedido-form.ts`), no la utilidad genérica de caché. `handleTiendaChange` ahora usa un contador de solicitud (`latestTiendaRequestId`) y descarta el resultado si el usuario ya volvió a cambiar de Tienda antes de que la solicitud actual resolviera. `dependent-options.ts` se simplificó para hacer únicamente lo que puede garantizar correctamente (cachear por valor de padre), documentando explícitamente esa responsabilidad dividida.

**Verificado de nuevo, sin regresión**: Cliente y Tienda cargan en paralelo al abrir "Nuevo pedido"; Sucursal permanece deshabilitada y vacía hasta elegir Tienda; al cambiar de Tienda, Sucursal se deshabilita y vacía inmediatamente y solo se rehabilita con las opciones correctas de la nueva tienda (confirmado contra el backend real que `GET /sucursales?tiendaId=X` sigue devolviendo exactamente las sucursales de esa tienda).

**Archivos modificados**: `src/utils/dependent-options.ts`, `src/pages/admin/pedidos/pedido-form.ts`.

### Regresión completa ejecutada tras las correcciones

Contra el backend real, repitiendo el ciclo completo de Pedidos con datos de prueba nuevos: Crear (201) → Ver detalle (200) → Editar (200) → Filtrar por `codigoPedido` → Filtrar por `sucursalId` → Paginación (`limit=1`) → Eliminar (200) → confirmación de `GET /pedidos/:id` → 404. Los datos de prueba se eliminaron al finalizar (se conservó únicamente la cuenta `admin_f7` como credencial de reemplazo). `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` (formateado con `--write`), `npm run build` — los cuatro sin errores. Servidor de desarrollo verificado por HTTP: todos los archivos modificados (`modal.ts`, `pedido-form.ts`, `dependent-options.ts`) se transforman sin error.

**Limitación de esta verificación**: no hay herramienta de automatización de navegador en este entorno (sin acceso a consola/Network del navegador real). La corrección del Problema 1 (altura/scroll del modal) y el comportamiento visual completo de los Problemas 2 y 5 se verificaron por lectura exhaustiva del código y las clases Tailwind aplicadas, y por simulación exacta de las llamadas HTTP subyacentes vía curl — no por interacción real en un navegador. Se recomienda al usuario volver a probar manualmente el módulo completo (con la cuenta `admin_f7` / `Passw0rd!`) antes de dar la fase por cerrada.

### URL local del servidor (actualizada)

- Frontend: **http://localhost:5173**. Iniciar sesión con **`admin_f7` / `Passw0rd!`** (las credenciales `admin_p3` documentadas desde la Fase 3 ya no existen en la base de datos — ver Problema 3).
- Backend: **http://localhost:3000/api/v1**.

## Fase 8 — Flujo Operativo de Pedidos (Administrador + Motorizado)

**Fecha:** 2026-07-13

### Alcance de esta fase

Flujo operativo completo del Pedido: Panel Administrativo (asignar/reasignar motorizado, cancelar pedido) y Panel del Motorizado (ver pedidos asignados, confirmar recojo, iniciar ruta, confirmar entrega, cliente ausente, rechazo, incidentes, historial, fotos). Sin reportes (fuera de alcance explícito).

### Contrato del backend revisado antes de escribir tipos

Se leyó directamente el código fuente completo de 4 módulos nuevos: `flujo-pedido` (los 8 DTOs de acciones: asignar/reasignar-motorizado, confirmar-recojo/entrega, iniciar-ruta, registrar-cliente-ausente/rechazo, cancelar-pedido, foto-entrega-input; el controller; y `flujo-pedido.service.ts` para entender las reglas de transición de estado exactas), `historial-pedido` (solo lectura), `fotos-entrega` (solo lectura, confirmado que solo acepta URLs de texto — `urlImagen: string`, nunca archivos), `incidentes` (CRUD parcial a propósito: crear/consultar/listar, sin PATCH/DELETE). Confirmado explícitamente contra el backend real (vía curl) cada transición de estado y cada restricción 409 documentada en el código.

### Decisiones técnicas resueltas por razonamiento propio (documentadas, no bloqueantes)

1. **"Ver pedidos asignados" sin filtro de backend por motorizado**: `GET /pedidos` no admite filtrar por `motorizadoActualId` (confirmado también en vivo: la API responde `400` si se envía `motorizadoId` como query, por la whitelist de validación). Se resolvió con `src/utils/fetch-all-pages.ts` (`fetchAllPages`): recorre todas las páginas del mismo endpoint ya existente (no inventa un endpoint) hasta reunir el listado completo, y el resultado se filtra en el cliente por `motorizadoActualId === miPerfilId` — nunca se muestran pedidos de otros motorizados. El listado filtrado se pagina de nuevo en memoria mediante un `fetchPage` local que simula el contrato de `ResourceTable`, permitiendo reutilizar `ResourceTable`/`DataTable`/`Pagination`/`SearchBar` sin ninguna modificación. Limitación documentada: a volúmenes muy grandes de pedidos esto implica más solicitudes HTTP que un filtro de servidor — aceptable para el volumen actual del sistema, mismo criterio que decisiones equivalentes de fases anteriores (Fase 6, filtro de usuarios por rol).
2. **Visibilidad de "Reasignar motorizado"**: a diferencia de las demás acciones del flujo, `reasignarMotorizado` en el backend **no** exige un estado específico del pedido — solo que exista un `motorizadoActualId` que coincida con `motorizadoAnteriorId`. Se implementó mostrando la acción exactamente cuando el backend la aceptaría (`pedido.motorizadoActualId != null`), sin restringir además por estado: agregar una restricción de estado que el backend no exige habría sido inventar una regla de negocio no definida. Se documenta como observación: un pedido ya `entregado` técnicamente admite reasignación según el backend actual.
3. **`Registrar incidente` es una acción exclusiva del Motorizado**: `CreateIncidenteDto` no tiene ningún campo que identifique "quién" hace la llamada aparte de `motorizadoId` (el incidente siempre se atribuye a un motorizado, nunca a un administrador). Se implementó únicamente en el panel del Motorizado (usa su propio `motorizadoId` resuelto de sesión); el panel Administrativo solo consulta/lista (`IncidentesPage`, de solo lectura), consistente con que el backend tampoco expone edición/eliminación de incidentes.
4. **Ubicación de la lógica compartida entre paneles** (Historial/Fotos de un pedido, usadas tanto por el "Ver detalle" de Admin como por el detalle de pedido del Motorizado): en vez de crear una carpeta nueva fuera de `pages/admin`/`pages/rider` (cambiaría la convención de carpetas ya documentada en `CLAUDE.md`), las funciones `PedidoHistorial`/`PedidoFotos` se colocaron en `pages/admin/pedidos/` (el módulo de referencia de Pedidos) y se importan directamente desde las páginas del Motorizado — "Admin y Rider comparten todo excepto layout, páginas y rutas propias" (`CLAUDE.md` sección 5) cubre explícitamente este caso, ya que no son ni una página ni una ruta.

### Tipos creados/extendidos

- `src/types/pedido.ts` (extendido): `AsignarMotorizadoPayload`, `ReasignarMotorizadoPayload`, `CancelarPedidoPayload`, `ConfirmarRecojoPayload`, `IniciarRutaPayload`, `ConfirmarEntregaPayload`, `FotoEntregaInput`, `RegistrarClienteAusentePayload`, `RegistrarRechazoPayload`, y la constante `ESTADOS_CANCELABLES` (reflejo exacto de `ESTADOS_CANCELABLES` del backend).
- `src/types/historial-pedido.ts`, `src/types/foto-entrega.ts`, `src/types/incidente.ts` (nuevos).

### Servicios creados/extendidos

- `src/services/pedidos.service.ts` (extendido): `asignarMotorizado`, `reasignarMotorizado`, `cancelarPedido`, `confirmarRecojo`, `iniciarRuta`, `confirmarEntrega`, `registrarClienteAusente`, `registrarRechazo`, `obtenerHistorial`, `obtenerFotos` — todo bajo `/pedidos/:id/...`, se extendió el servicio existente en vez de crear un `FlujoPedidoService` aparte, siguiendo la instrucción explícita de esta fase.
- `src/services/motorizados.service.ts` (extendido): `buscarPorUsuarioId(usuarioId)` — resuelve el perfil operativo del usuario con sesión activa (rol motorizado); devuelve `null` si el usuario todavía no tiene perfil (caso real, no error).
- `src/services/incidentes.service.ts` (nuevo): `listar`/`buscarPorId`/`crear` (sin `actualizar`/`eliminar`, igual que el backend).

### Infraestructura nueva creada

- **`src/utils/fetch-all-pages.ts`** (`fetchAllPages`): genérica, sin conocimiento de ningún módulo — recorre cualquier endpoint paginado existente hasta reunir todos los resultados. Reutilizable por cualquier futura pantalla que necesite un filtro que el backend no soporte.
- **`src/constants/estado-pedido.ts`** (`ESTADO_PEDIDO_LABEL`, `ESTADO_PEDIDO_BADGE_VARIANT`, `ESTADOS_TERMINALES`): se extrajo del `pedidos.page.ts` de la Fase 7 (donde vivían como constantes locales) porque esta fase necesitaba el mismo mapeo en 4 lugares más (Historial de pedido, Mis Pedidos, Historial del Motorizado) — tercera repetición real, se generaliza siguiendo la propia regla del proyecto.
- **`pages/admin/pedidos/pedido-historial.ts`** y **`pedido-fotos.ts`**: tablas (reutilizan `DataTable`) de eventos de historial y fotos de un pedido, sin filtros/paginación propia (se pide una sola página de hasta 50 resultados, suficiente para el ciclo de vida real de un pedido) — compartidas por Admin y Motorizado (ver decisión 4 arriba).
- **`pages/rider/mis-pedidos/confirmar-entrega-form.ts`**: formulario con lista dinámica de fotos (agregar/quitar filas), ya que el backend exige un arreglo de 1 o más URLs para confirmar la entrega.
- **`pages/rider/mis-pedidos/incidente-form.ts`**: formulario de tipo de incidente (enum cerrado), con `pedidoId` opcional tal como lo permite el backend.

### Componente mejorado

Ninguno esta fase — `Select` (extendido en la Fase 7) ya cubría todo lo necesario; los formularios nuevos (URL de recojo, fotos de entrega, incidente) se armaron con `Input`/`Textarea`/`Checkbox`/`Select` existentes sin cambios.

### Componentes/infraestructura reutilizados sin cambios

`ResourceTable`, `FormModal`, `RowActions`, `DetailList`, `DataTable`, `Pagination`, `SearchBar`, `Modal` (con el scroll interno corregido en la Fase 7), `confirmDialog`/`infoAlert`, `Loader`, `EmptyState`, `Skeleton`, `Dropdown`, `Section`, `Badge`, `Input`, `Textarea`, `Checkbox`, `Select`, `IconButton`, `Button`, `PageHeader`, `Breadcrumb`, `toSelectOptions`. Ningún componente duplicado ni variante específica de esta fase.

### Panel Administrativo — Pedidos (extendido)

- **Asignar motorizado**: visible solo cuando `estado === 'pendiente'`; selector real de motorizados (`MotorizadosService`, bulk fetch igual que Tiendas/Sucursales); `usuarioId` tomado automáticamente de la sesión activa (mismo patrón que `creadoPorId` en la Fase 7).
- **Reasignar motorizado**: visible cuando hay un motorizado asignado (ver decisión 2); excluye de las opciones al motorizado actual (evita una reasignación sin efecto).
- **Cancelar pedido**: visible solo en los estados de `ESTADOS_CANCELABLES`; confirmación previa (SweetAlert2, estilo destructivo).
- **Ver detalle**: ahora incluye el motorizado asignado (resuelto a `placa (estado)`), y dos secciones nuevas (`Historial`, `Fotos`) cargadas de forma asíncrona dentro del mismo modal (ya con scroll interno, corregido en la Fase 7).

### Panel Administrativo — Incidentes (nuevo)

Página de solo lectura (`/admin/incidentes`, nuevo ítem del Sidebar): listado con filtros por tipo y resuelto, "Ver detalle". Sin crear/editar/eliminar, reflejando el CRUD parcial real del backend.

### Panel del Motorizado — Mis pedidos (nuevo, reemplaza el placeholder)

Resuelve el perfil propio (`MotorizadosService.buscarPorUsuarioId`) al montar; si no existe, `EmptyState` explicando que debe contactar a un administrador (caso real, no simulado). Lista solo los pedidos activos (no terminales) asignados a ese perfil. Acciones por fila según estado: Confirmar recojo (`asignado`, pide URL de foto), Iniciar ruta (`recogido`, solo confirmación), Confirmar entrega/Cliente ausente/Rechazo (`en_ruta`), Reportar incidente (cualquier estado) y Ver detalle. Un botón de cabecera permite reportar un incidente no ligado a ningún pedido. Cada acción exitosa actualiza el pedido en el arreglo local (o lo quita si pasó a un estado terminal) y recarga la tabla — sin recargar la página completa.

### Panel del Motorizado — Historial (nuevo, reemplaza el placeholder)

Mismo mecanismo que Mis Pedidos, pero filtrado a estados terminales (`ESTADOS_TERMINALES`). Solo lectura: únicamente "Ver detalle" (con Historial y Fotos del pedido).

### Endpoints consumidos

`POST /pedidos/:id/asignar-motorizado`, `/reasignar-motorizado`, `/cancelar`, `/confirmar-recojo`, `/iniciar-ruta`, `/confirmar-entrega`, `/cliente-ausente`, `/rechazo`; `GET /pedidos/:id/historial`, `/pedidos/:id/fotos`; `GET/POST /incidentes`, `GET /incidentes/:id`. Reutilizados de fases anteriores: `GET /pedidos` (con recorrido completo de páginas), `GET /perfiles-motorizados` (con `usuarioId`), `GET /clientes`, `GET /sucursales`, `GET /tiendas`.

### Pruebas realizadas

**Contra el backend real (vía curl, simulando exactamente las llamadas de los servicios nuevos)**: se crearon 2 usuarios motorizados con perfil (uno ya existente, uno nuevo — `moto_f8`/`Passw0rd!`, perfil id 14) y varios pedidos de prueba para cubrir:

- Asignar motorizado (201) → intento de asignar de nuevo sobre un pedido ya asignado (409) → Reasignar motorizado (201, cambia `motorizadoActualId`).
- Confirmar recojo con el motorizado correcto (201) → intento con el motorizado equivocado (409) → Iniciar ruta (201) → Confirmar entrega con 2 fotos (201, estado final `entregado`).
- Cancelar un pedido pendiente (201) → intento de cancelar de nuevo (409, ya no está en un estado cancelable).
- Cliente ausente (201) y Rechazo (201) sobre pedidos independientes en estado `en_ruta`.
- Historial del pedido completo (5 eventos: asignado, reasignación, recogido, en_ruta, entregado) y Fotos (recojo + 2 de entrega) — verificados campo por campo contra los tipos TypeScript.
- Incidente ligado a un pedido e incidente sin pedido (`pedidoId: null`), y filtro de incidentes por `motorizadoId`.
- Confirmado en vivo que `GET /pedidos?motorizadoId=X` responde `400` (no es un filtro soportado), validando la decisión de usar `fetchAllPages` + filtro en el cliente; y que efectivamente hay pedidos en distintos estados (activos/terminales) repartidos para el motorizado de prueba, coherente con lo que "Mis pedidos"/"Historial" deberían separar.
- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` (formateado con `--write`), `npm run build` — los cuatro sin errores.
- Servidor de desarrollo verificado por HTTP: los 15 archivos nuevos/modificados de esta fase se transforman sin error; `/admin/incidentes`, `/rider/mis-pedidos` y `/rider/historial` sirven `200`.

**Datos de prueba dejados intencionalmente en la base de datos**: los pedidos de prueba (ids 25-29) no se pudieron eliminar (`409`, ya tienen historial/fotos/incidentes asociados — comportamiento correcto del backend, no un error) y quedaron como datos reales para que el usuario explore el flujo completo manualmente: 1 pedido activo (`asignado`) y 3 cerrados (`entregado`, `cliente_ausente`, `rechazado`) asignados al motorizado de prueba `moto_f8`. Se dejó también la cuenta `moto_f8` / `Passw0rd!` (rol motorizado, perfil con placa `F8-0002`) como credencial válida para probar el panel del Motorizado, junto con `admin_f7` / `Passw0rd!` (Fase 7) para el panel Administrativo.

**Limitación de esta verificación (igual que en fases anteriores)**: no hay herramienta de automatización de navegador en este entorno. La interacción visual completa (apertura de modales, formulario dinámico de fotos, actualización en vivo de la tabla tras cada acción, dark mode, responsive, Sidebar/Navbar) **no se verificó visualmente por mí** — se verificó exhaustivamente por lectura de código y por simulación exacta de las llamadas HTTP subyacentes vía curl. Se recomienda al usuario probar manualmente ambos paneles antes de dar la fase por cerrada.

### URL local del servidor

- Frontend: **http://localhost:5173**.
  - Panel Administrativo: `admin_f7` / `Passw0rd!` → `/admin/pedidos`, `/admin/incidentes`.
  - Panel del Motorizado: `moto_f8` / `Passw0rd!` → `/rider/mis-pedidos`, `/rider/historial`.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante.

### Trabajo pendiente (explícitamente fuera de esta fase)

- Reportes.
- Página de "Perfil" y Dashboard real del Motorizado (siguen como placeholders — no forman parte de los casos de uso de esta fase).
- Filtro de backend por `motorizadoActualId` en `GET /pedidos` (si el backend lo incorporara en el futuro, `fetchAllPages` dejaría de ser necesario para "Mis pedidos"/"Historial").
- Verificación visual interactiva completa por parte del usuario.

## Fase 9 — Módulo Analítico y Reportes

**Fecha:** 2026-07-13

### Alcance de esta fase

Módulo de Reportes completo: Reporte de Pedidos (CU18), Reporte de Entregas (CU19) y Reporte de Productividad de Motorizados (CU20). Solo visualización/análisis — sin exportación PDF/Excel, sin impresión, sin gráficos (explícitamente fuera de alcance).

### Contrato del backend revisado antes de escribir tipos

Se leyó directamente el código fuente completo del módulo `reportes`: los 3 query DTOs (`reporte-pedidos-query`, `reporte-entregas-query`, `reporte-motorizados-query`), los 2 item DTOs (`reporte-pedido-item`, `reporte-motorizado-item`), el controller y el repository interface (para confirmar `ESTADOS_REPORTE_ENTREGAS`, la lista cerrada de 4 estados que acepta el filtro `estado` del Reporte de Entregas). Confirmado en vivo contra el backend real: es un módulo de solo lectura (únicamente `GET`), `reporte-pedidos`/`reporte-motorizados` devuelven exactamente la forma esperada, y `reporte-entregas` responde `400` si se envía un `estado` fuera de los 4 permitidos.

### Decisiones técnicas resueltas por razonamiento propio (documentadas, no bloqueantes)

1. **No existe un endpoint de agregados/KPIs**: los 3 endpoints de reportes son listados paginados de filas, sin un endpoint separado que devuelva totales/sumas. Se resolvió calculando los KPIs en el cliente con `fetchAllPages` (Fase 8) sobre el **mismo** endpoint y los **mismos** filtros que usa la tabla: se recorren todas las páginas que coincidan con los filtros vigentes, y los KPIs se calculan sobre ese conjunto completo (no solo la página visible). La tabla, en cambio, sigue consultando el backend página por página a través de `ResourceTable` (más eficiente para la sola visualización tabular) — son dos lecturas independientes del mismo filtro, no una duplicación de lógica.
2. **Filtro de fecha con `<input type="date">`**: no existía un componente de selección de fechas en el proyecto (se había diferido explícitamente en la Fase 7 por no ser necesario entonces). Se resolvió reutilizando `Input` con `type="date"` (control nativo del navegador, cero componentes nuevos) en vez de construir un date-picker propio.
3. **Observación de comportamiento (no un bug del frontend)**: el backend interpreta `fechaHasta` como el instante exacto de esa fecha a medianoche (`Date` sin componente de hora), no como "fin de ese día". Verificado en vivo: filtrar con `fechaHasta` igual al día de hoy excluye los pedidos creados hoy mismo después de medianoche; para incluir todo el día, el usuario debe seleccionar el día siguiente como `fechaHasta`. Es el comportamiento real y esperado del contrato (`@Type(() => Date)` sobre un string de solo fecha), no algo que el frontend deba "corregir" silenciosamente alterando la fecha que el usuario eligió.
4. **Integración al menú**: se reemplazó el único ítem placeholder "Reportes" del Sidebar por 3 ítems planos ("Reporte de Pedidos", "Reporte de Entregas", "Reporte de Productividad"), siguiendo exactamente el mismo patrón que todos los módulos anteriores (un ítem de Sidebar = una ruta = una página) — no se creó una página de aterrizaje ni se modificó el componente `Sidebar` para soportar sub-menús, evitando tocar la arquitectura de navegación existente.

### Tipos creados

- `src/types/reporte.ts` — `ReportePedidoItem` (fila compartida por Reporte de Pedidos y Reporte de Entregas), `ReportePedidosParams`, `ReporteEntregasParams`, `ESTADOS_REPORTE_ENTREGAS`, `ReporteMotorizadoItem`, `ReporteMotorizadosParams`. Reutiliza `EstadoPedido` (de `types/pedido.ts`) y `EstadoMotorizado` (de `types/perfil-motorizado.ts`) en vez de redefinirlos.

### Servicio creado

- `src/services/reportes.service.ts` — `ReportesService` (`reportePedidos`, `reporteEntregas`, `reporteMotorizados`), solo lectura, igual que el backend.

### Infraestructura reutilizable creada

- **`src/components/report-filters/report-filters.ts`** (`ReportFilters`): infraestructura de filtros única para los 3 reportes. Configurable por `fields` (unión discriminada `dateRange` | `select` | `search`, extensible a futuros tipos de filtro sin tocar los reportes existentes). No conoce endpoints, servicios, tablas ni lógica de negocio: arma los controles (reutilizando `Input`/`Select` existentes) y emite un único objeto `Record<string, string>` al presionar "Aplicar filtros" o "Limpiar". Cada página de reporte es responsable de convertir ese objeto a los tipos exactos de su propio servicio (`Number(...)` para ids, `as EstadoPedido` para el estado).
- **`StatCard` extendido** (`src/components/stat-card/stat-card.ts`): se agregaron `description`, `variant` (color semántico, misma paleta que `Badge`) y `loading` (placeholders `Skeleton`) — el componente de KPI que ya existía desde la Fase 2 (usado por el Dashboard) ahora cubre exactamente lo pedido por esta fase, sin crear una tarjeta de KPI nueva. Cambio retrocompatible: el uso existente en `dashboard.page.ts` sigue funcionando sin cambios.
- **`pages/admin/reportes/reporte-pedido-columns.ts`** (`buildReportePedidoColumns`): columnas de `DataTable` compartidas por Reporte de Pedidos y Reporte de Entregas, ya que ambos endpoints devuelven exactamente la misma forma de fila (`ReportePedidoItemDto`) — evita duplicar la definición de columnas entre las dos páginas.

### Preparado para incorporar gráficos sin modificar las páginas existentes

Cada página separa claramente 3 responsabilidades: (1) `ReportFilters` emite los parámetros, (2) `loadKpis()` calcula y renderiza los `StatCard` a partir del conjunto completo ya obtenido, (3) `buildTable()` reconstruye el `ResourceTable`. Un futuro gráfico se agregaría como una nueva `Section` alimentada por los mismos datos ya obtenidos en `loadKpis()` (el arreglo completo vía `fetchAllPages`), sin tocar `ReportFilters`, el servicio ni la tabla.

### Componentes/infraestructura reutilizados sin cambios

`ResourceTable`, `DataTable`, `Pagination` (vía `ResourceTable`), `Input`, `Select`, `Button`, `Badge`, `Loader`, `EmptyState` (vía `DataTable`), `PageHeader`, `Breadcrumb`, `infoAlert`, `fetchAllPages` (Fase 8), `ESTADO_PEDIDO_LABEL`/`ESTADO_PEDIDO_BADGE_VARIANT` (Fase 8). Ningún componente duplicado.

### Reportes implementados

- **Reporte de Pedidos** (`/admin/reportes/pedidos`): filtros — rango de fechas, tienda (real, `TiendasService`), estado (10 valores), motorizado (real, `MotorizadosService`). KPIs: Total, Pendientes, Entregados, Cancelados. Tabla: código, tienda, sucursal, cliente (resuelto), motorizado (resuelto), estado, fecha.
- **Reporte de Entregas** (`/admin/reportes/entregas`): filtros — rango de fechas, estado (restringido a los 4 valores de `ESTADOS_REPORTE_ENTREGAS`). KPIs: Total (con tasa de entrega exitosa como descripción), Entregados, Cancelados, Devueltos, Reprogramados. Misma tabla que Reporte de Pedidos (columnas compartidas).
- **Reporte de Productividad de Motorizados** (`/admin/reportes/motorizados`): filtros — rango de fechas, motorizado. KPIs: Motorizados, Pedidos atendidos (suma), Entregas (suma, con total de incidentes como descripción), Productividad general (`sum(entregas)/sum(pedidosAtendidos)*100`, misma fórmula que usa el backend por fila, aplicada al agregado). Tabla: placa, estado, pedidos atendidos, entregas, incidentes, productividad (%).

### Endpoints consumidos

`GET /reportes/pedidos`, `GET /reportes/entregas`, `GET /reportes/motorizados`. Reutilizados de fases anteriores para resolver nombres/opciones de filtro: `GET /tiendas`, `GET /perfiles-motorizados`, `GET /clientes`.

### Pruebas realizadas

Contra el backend real, vía curl reproduciendo exactamente las llamadas de `ReportesService`:

- Reporte de Pedidos: sin filtros (6 resultados con los datos de prueba de fases anteriores), filtrado por `estado=entregado` (1 resultado), filtrado por `tiendaId` real (5 resultados), y por rango de fechas (confirmando el comportamiento de `fechaHasta` descrito en la decisión 3).
- Reporte de Entregas: sin filtros (2 resultados: cancelado + entregado), y confirmación de `400` al enviar `estado=pendiente` (no es uno de los 4 estados finales permitidos) — validando que el `Select` de estado de esta página solo deba ofrecer los 4 valores correctos.
- Reporte de Motorizados: sin filtros (2 motorizados con sus conteos reales) y filtrado por `motorizadoId` (1 resultado) — verificados campo por campo contra `ReporteMotorizadoItem` (incluyendo que `productividad` llega como `number`, no como string).
- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` (formateado con `--write`), `npm run build` — los cuatro sin errores.
- Servidor de desarrollo verificado por HTTP: los 10 archivos nuevos/modificados de esta fase se transforman sin error; las 3 rutas nuevas sirven `200`.

**Limitación de esta verificación (igual que en fases anteriores)**: no hay herramienta de automatización de navegador en este entorno. La interacción visual completa (aplicar/limpiar filtros desde la interfaz, KPIs con estado de carga, paginación de la tabla, responsive, dark mode, Sidebar/Navbar) **no se verificó visualmente por mí** — se verificó por lectura exhaustiva del código y por simulación exacta de las llamadas HTTP subyacentes vía curl. Se recomienda al usuario probar manualmente los 3 reportes antes de dar la fase por cerrada.

### URL local del servidor

- Frontend: **http://localhost:5173** (`admin_f7` / `Passw0rd!`) → `/admin/reportes/pedidos`, `/admin/reportes/entregas`, `/admin/reportes/motorizados`.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante.

### Trabajo pendiente (explícitamente fuera de esta fase)

- Exportación PDF/Excel, impresión, gráficos (los tres explícitamente fuera de alcance).
- Verificación visual interactiva completa por parte del usuario.

**No se avanza a la Fase 10 sin autorización explícita.**

## Fase 10 — Dashboard Ejecutivo (Datos Reales)

**Fecha:** 2026-07-14

### Alcance de esta fase

Reemplazo completo del Dashboard provisional de la Fase 2: se eliminaron todos los datos simulados (`dashboard.mock-data.ts`, borrado) y el Dashboard ahora se conecta exclusivamente a información real, a través de una fachada nueva (`DashboardService`). Sin gráficos (explícitamente fuera de alcance).

### Revisión de endpoints antes de implementar

No existe (ni se creó) un endpoint `GET /dashboard`: se revisaron los servicios ya existentes (Pedidos, Clientes, Tiendas, Sucursales, Motorizados, Reportes) para identificar cuáles permiten construir cada KPI/widget sin inventar información. Hallazgo clave revisando `Backend/src/modules/reportes/reportes.repository.ts`: `reportePedidos`/`reporteEntregas` ordenan `creadoEn: 'desc'` de forma nativa, mientras que `PedidosService.listar` (CRUD de Pedidos) siempre ordena `id: 'asc'` (documentado desde la Fase 4) — este hallazgo cambió la fuente elegida para "Pedidos recientes" (ver decisión 2).

### DashboardService (fachada obligatoria)

`src/services/dashboard.service.ts` — único punto que `DashboardPage` consulta. `DashboardService.obtenerDashboard()` reutiliza internamente `PedidosService`, `MotorizadosService`, `ClientesService`, `TiendasService`, `SucursalesService` y `ReportesService`, dispara las 11 consultas necesarias con **`Promise.allSettled`** (no `Promise.all`, ver decisión 3) y devuelve un único objeto tipado (`DashboardData`). Si en el futuro el backend expone `GET /dashboard`, solo este archivo cambiaría — ningún componente ni página necesitaría tocarse, ya que `DashboardPage` solo conoce la forma de `DashboardData`.

### Decisiones técnicas resueltas por razonamiento propio (documentadas, no bloqueantes)

1. **"Motorizados activos" requiere un cálculo, documentado explícitamente**: `ListPerfilesMotorizadosQueryDto` solo filtra por un único valor de `estado` a la vez, no admite "distinto de". Se calcula como `totalMotorizados - motorizadosInactivos` (es decir, `disponible + ocupado`), con 2 consultas `limit=1` (solo se necesita el campo `total` de cada una). Documentado también como comentario en `types/dashboard.ts` y `dashboard.service.ts`.
2. **"Pedidos recientes" usa `ReportesService.reportePedidos`, no `PedidosService.listar`**: como el CRUD de Pedidos ordena siempre `id: asc`, la página 1 devolvería los pedidos más **antiguos**, no los recientes. `reportePedidos` ya ordena `creadoEn: desc` de forma nativa (hallazgo de esta fase) y además ya trae `tiendaNombre`/`sucursalNombre` resueltos — se eligió como fuente para este widget en vez de construir la lógica de "calcular la última página" que se había usado en la Fase 8 para un problema similar (más simple y más eficiente, un único request).
3. **`Promise.allSettled` en vez de `Promise.all`**: un fallo puntual (ej. un solo endpoint caído) no debe tumbar todo el Dashboard. Cada KPI es `number | null` (`null` = esa consulta específica falló) — la página muestra "—" y una nota "No se pudo obtener" únicamente en el `StatCard` afectado, con el resto del Dashboard funcionando con normalidad. Es una decisión de resiliencia, no de datos: nunca se inventa un valor de reemplazo.
4. **"Actividad reciente" reutiliza los mismos datos que "Pedidos recientes"** (cero solicitudes adicionales): no existe un endpoint de actividad/historial global (`historial-pedido` es por pedido individual, no agregado). Construir un timeline global habría exigido una consulta de historial por cada pedido reciente (N solicitudes adicionales, contra la instrucción explícita de evitar peticiones redundantes). Se optó por la mejor aproximación posible con los datos ya obtenidos: cada pedido reciente se presenta como un evento de "creación" (`Pedido {código} registrado — {estado actual}` + tiempo relativo), honesto sobre lo que realmente se sabe (cuándo se creó, no cada cambio de estado que tuvo).
5. **Accesos rápidos vs. "no duplicar accesos ya visibles en el Sidebar"**: en el estado actual de la aplicación, todo destino posible para un acceso rápido ya tiene una entrada en el Sidebar (no existen acciones profundas — ej. abrir directamente un modal de creación — accesibles por URL sin modificar las páginas ya cerradas de fases anteriores). Se resolvió manteniendo la sección con una lista reducida (4, antes también 4 pero distintas) y reformulando las etiquetas como **acciones** ("Nuevo pedido", "Nuevo cliente", "Nueva tienda", "Ver incidentes") en vez de nombres de sección pasivos — mismo destino final que el Sidebar, pero con una intención explícita de acción, que es la diferenciación más honesta posible sin ampliar el alcance de esta fase modificando otras páginas.

### Tipos creados

- `src/types/dashboard.ts` — `DashboardKpis` (8 campos, todos `number | null`), `DashboardPedidoReciente` (`ReportePedidoItem` + `clienteNombre` resuelto aparte, sin sobreescribir `clienteId`), `DashboardData`.

### Servicio creado

- `src/services/dashboard.service.ts` — `DashboardService.obtenerDashboard()`. Sin servicios nuevos en el backend (instrucción explícita); es una fachada 100% frontend sobre servicios ya existentes.

### KPIs implementados (8, con la fórmula exacta de cada uno)

| KPI                    | Fuente                      | Cálculo                                              |
| ---------------------- | --------------------------- | ---------------------------------------------------- |
| Pedidos hoy            | `PedidosService.listar`     | `total` con `fechaDesde`=hoy, `fechaHasta`=mañana    |
| Pedidos pendientes     | `PedidosService.listar`     | `total` con `estado=pendiente`                       |
| Pedidos en ruta        | `PedidosService.listar`     | `total` con `estado=en_ruta`                         |
| Pedidos entregados     | `PedidosService.listar`     | `total` con `estado=entregado` (histórico)           |
| Motorizados activos    | `MotorizadosService.listar` | `total` (sin filtro) − `total` con `estado=inactivo` |
| Clientes registrados   | `ClientesService.listar`    | `total` (sin filtro)                                 |
| Tiendas registradas    | `TiendasService.listar`     | `total` (sin filtro)                                 |
| Sucursales registradas | `SucursalesService.listar`  | `total` (sin filtro)                                 |

Todas las consultas usan `limit=1` (solo se necesita el campo `total` de la respuesta paginada) para minimizar el payload.

### Widgets implementados

- **KPIs** (8 `StatCard`, extendidos en la Fase 9 con `loading`/`variant`/`description`): loading mientras `DashboardService` resuelve; `variant:'danger'` + descripción "No se pudo obtener" en el KPI puntual que falló.
- **Pedidos recientes**: `DataTable` con los 8 pedidos más recientes (`ReportesService.reportePedidos`, sin paginar — "si basta con mostrar los últimos registros, no paginar"). Estados de carga/vacío/error vía `Loader`/`EmptyState` propios del wrapper (el error no usa el `error` interno de `DataTable` para evitar pasar columnas/filas vacías artificialmente).
- **Actividad reciente**: lista basada en los mismos pedidos recientes (ver decisión 4), con icono, descripción y tiempo relativo (`dayjs().fromNow()`, ya configurado desde la Fase 2).
- **Accesos rápidos**: 4 accesos de acción (ver decisión 5).

### Componentes reutilizados sin cambios

`StatCard`, `DataTable`, `Loader`, `Skeleton` (vía `StatCard.loading`), `EmptyState`, `Badge`, `PageHeader`, `Breadcrumb`, `Card`, `Section`, `Icon`. Ningún componente nuevo ni modificado esta fase (todo lo necesario ya existía tras la Fase 9).

### Endpoints consumidos

`GET /pedidos` (4 variantes de filtro), `GET /perfiles-motorizados` (2 variantes), `GET /clientes` (2 variantes: total y bulk para nombres), `GET /tiendas`, `GET /sucursales`, `GET /reportes/pedidos`. Ninguno nuevo — los 6 ya documentados en fases anteriores.

### Pruebas realizadas

Contra el backend real, vía curl reproduciendo exactamente las 11 llamadas de `DashboardService.obtenerDashboard()`:

- Cada KPI verificado por separado (`pedidos hoy`=0 al no haber pedidos creados en la fecha actual del sistema, `pendientes`=0, `en_ruta`=0, `entregados`=1, `motorizados`=2 totales con 0 inactivos → 2 activos, `clientes`=3, `tiendas`=2, `sucursales`=2 — todos verificados con los datos reales ya presentes en la base de datos, incluidos registros creados manualmente por el usuario en sesiones anteriores).
- `GET /reportes/pedidos?limit=8` verificado devolviendo los pedidos en orden `creadoEn` descendente con `tiendaNombre`/`sucursalNombre` ya resueltos, confirmando la decisión 2.
- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` (formateado con `--write`), `npm run build` — los cuatro sin errores.
- Servidor de desarrollo verificado por HTTP: los 3 archivos nuevos/reescritos se transforman sin error; confirmado que `dashboard.mock-data.ts` ya no se sirve como módulo real (la respuesta 200 en esa ruta es el _fallback_ HTML genérico de Vite para rutas inexistentes, no una transformación).

**Limitación de esta verificación (igual que en fases anteriores)**: no hay herramienta de automatización de navegador en este entorno. La interacción visual completa (loading/skeleton de cada KPI, responsive, dark mode, accesos rápidos, Sidebar/Navbar) **no se verificó visualmente por mí** — se verificó por lectura exhaustiva del código y por simulación exacta de las llamadas HTTP subyacentes vía curl. Se recomienda al usuario verificar manualmente antes de dar la fase por cerrada.

### URL local del servidor

- Frontend: **http://localhost:5173** (`admin_f7` / `Passw0rd!`) → `/admin/dashboard`.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante.

### Trabajo pendiente (explícitamente fuera de esta fase)

- Gráficos (explícitamente fuera de alcance; la separación KPIs/tabla/actividad ya deja el terreno preparado para agregarlos después).
- Verificación visual interactiva completa por parte del usuario.

**No se avanza a la Fase 11 sin autorización explícita.**

## Fase 11 — Mi Perfil

**Fecha:** 2026-07-14

### Alcance de esta fase

Eliminación completa del módulo "Configuración" (nunca implementado más allá de un placeholder) y su reemplazo por un único módulo "Mi Perfil", compartido verbatim por el panel Administrativo (`/admin/perfil`) y el panel del Motorizado (`/rider/perfil`) — misma página, mismo componente, sin ramas por rol.

### Backend revisado antes de implementar

Se confirmó que `PATCH /usuarios/:id` (ya usado por el CRUD de Usuarios desde la Fase 4) cubre todo lo necesario: consultar (`GET /usuarios/:id`), editar `usuario`/`correo`, y cambiar la contraseña (el propio comentario del controller ya lo documenta: "la contrasena solo se modifica si se envia"). No fue necesario ningún endpoint nuevo ni cambio de contrato — se reutilizó exactamente la misma implementación de Usuarios.

### ProfileService (fachada obligatoria)

`src/services/profile.service.ts` — único punto que `ProfilePage` consulta. Nunca importa `UsuariosService` ni `SessionService` la página: `ProfileService.obtenerPerfil()` trae el usuario fresco del backend (`UsuariosService.buscarPorId`, usando el `id` de `SessionService.getCurrentUser()`) y sincroniza la sesión con esa copia; `actualizarPerfil()`/`actualizarPassword()` llaman a `UsuariosService.actualizar()` y sincronizan `SessionService` únicamente cuando corresponde (la contraseña nunca se guarda en sesión).

### Decisiones técnicas resueltas por razonamiento propio (documentadas, no bloqueantes)

1. **Campos protegidos, no editables desde Mi Perfil**: aunque `UpdateUsuarioDto` (al ser `PartialType(CreateUsuarioDto)`) técnicamente admite editar `rol` vía el mismo `PATCH`, el formulario de Mi Perfil solo expone `usuario`/`correo` como editables — `rol` y `activo` (estado) se muestran de solo lectura. Permitir que un usuario cambie su propio rol o active/desactive su cuenta sería una escalada de privilegios que el backend no previene explícitamente pero que no corresponde a una pantalla de autoservicio.
2. **"Fecha de inicio de sesión" omitida**: el backend (`UsuarioResponseDto`) no expone ningún timestamp de login. El brief la marcaba como "si está disponible" — al no estar disponible en el backend y no ser parte de lo ya guardado en `SessionService`, se omitió en vez de inventar un mecanismo nuevo de tracking (evita ampliar el alcance de esta fase).
3. **"Versión del sistema"**: se agregó `appVersion` a `src/config/env.ts` (único punto de configuración del proyecto) reflejando literalmente la versión actual de `package.json` (`0.0.0`) — dato real del propio frontend, no inventado, sin necesitar cambios de build/tooling (`resolveJsonModule`, etc.) para importar `package.json` directamente.
4. **Ubicación de la página compartida**: como "Mi Perfil" no pertenece más a un panel que a otro (a diferencia de los casos de la Fase 8, donde el componente compartido sí tenía un dominio "dueño"), se creó `src/pages/profile/profile.page.ts` — una tercera carpeta de primer nivel bajo `pages/`, hermana de `admin/` y `rider/`, dedicada a páginas genuinamente neutrales por panel. Es una adición mínima y explícita a la convención de carpetas (documentada en `CLAUDE.md`), no una alteración de la arquitectura existente.
5. **`ROL_LABEL` extraído a `constants/rol-usuario.ts`**: el módulo Usuarios (Fase 4) ya tenía un mapa local `ROL_LABEL`; esta fase necesitaba el mismo mapeo por segunda vez en Mi Perfil — se extrajo a `constants/` (mismo criterio que `ESTADO_PEDIDO_LABEL` en la Fase 8) y se actualizó `usuarios.page.ts` para reutilizarlo en vez de duplicarlo.

### Navegación actualizada

- **Sidebar Administrador**: se eliminó el ítem "Configuracion" (`/admin/configuracion`); se agregó "Mi Perfil" (`/admin/perfil`).
- **Sidebar Motorizado**: el ítem ya apuntaba a `/rider/perfil` (Fase 2); se renombró su etiqueta de "Perfil" a "Mi Perfil" por consistencia con el panel Administrativo.
- **Router**: se eliminó por completo el registro de `/admin/configuracion` (placeholder); se registraron `/admin/perfil` y `/rider/perfil` como rutas reales, ambas apuntando a la misma `ProfilePage()`.
- **Navbar**: el ítem "Mi perfil" del menú de usuario (deshabilitado desde la Fase 3) ahora navega de verdad — se agregó la prop `profileHref` a `Navbar` (distinta por panel) y se reutilizó el mecanismo `href` de `Dropdown` (Fase 5) en vez de crear una alternativa nueva.
- **Breadcrumb/títulos**: "Mi Perfil" en ambos paneles. No quedan referencias a "Configuracion" en el código (verificado).

### Sincronización de sesión

`ProfileService` es el único punto que llama a `SessionService.updateSession(...)`, tanto después de `obtenerPerfil()` (por si el usuario cambió en el backend desde otro origen) como después de `actualizarPerfil()`. Nunca se cierra sesión ni se recarga la aplicación: la página solo reconstruye las tarjetas afectadas con los datos ya actualizados devueltos por `ProfileService`.

### Tema

La tarjeta "Tema" en Mi Perfil reutiliza exactamente `utils/theme.ts` (`getTheme`/`setTheme`/`onThemeChange`, ya usado por `Navbar` desde la Fase 2) — mismos botones Claro/Oscuro, mismo mecanismo de persistencia (`localStorage`, clave `haku-theme`), sin ninguna lógica nueva. El cambio se refleja de inmediato (misma suscripción `onThemeChange` que ya sincroniza el ícono del `Navbar`).

### Componentes reutilizados sin cambios

`Card`, `Button`, `Input`, `Avatar`, `Badge`, `DetailList`, `Loader`, `EmptyState`, `PageHeader`, `Breadcrumb` (vía `PageHeader`), `confirmDialog`/`infoAlert`, `showSuccessToast`.

### Componente mejorado

`Navbar` — se agregó la prop obligatoria `profileHref` y se activó el ítem "Mi perfil" del menú de usuario (antes `disabled: true`). Cambio no retrocompatible a propósito (`profileHref` es obligatorio, no opcional): cualquier layout que use `Navbar` debe decidir explícitamente a dónde apunta "Mi perfil" — ya se actualizaron los dos únicos consumidores existentes (`AdminLayout`, `RiderLayout`).

### Infraestructura reutilizada

Ninguna infraestructura nueva esta fase — todo lo necesario (Card, Input, Avatar, DetailList, tema, sesión, Dropdown con `href`) ya existía de fases anteriores.

### Endpoints consumidos

`GET /usuarios/:id`, `PATCH /usuarios/:id` (para datos personales y, por separado, para la contraseña). Ninguno nuevo.

### Pruebas realizadas

Contra el backend real, vía curl reproduciendo exactamente las llamadas de `ProfileService`:

- `GET /usuarios/38` (admin_f7) y `PATCH /usuarios/38` con los mismos valores (actualización sin cambios reales, para no alterar la cuenta) — 200 en ambos.
- `PATCH` con correo inválido → 400 (validación del backend, reflejada en el formulario del lado cliente).
- Cambio de contraseña: `PATCH` con una contraseña temporal, login exitoso con ella, luego `PATCH` revirtiendo a `Passw0rd!` y confirmación de login exitoso con la contraseña original — se dejó la credencial documentada intacta tras la prueba.
- `PATCH` con contraseña de 5 caracteres → 400 (confirma el límite mínimo de 8 que ya valida el formulario del lado cliente).
- Repetido `GET`/`PATCH` sobre la cuenta motorizada (`moto_f8`, id 40) para confirmar que ambos paneles usan exactamente el mismo endpoint sin ninguna diferencia de comportamiento.
- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` (formateado con `--write`), `npm run build` — los cuatro sin errores.
- Servidor de desarrollo verificado por HTTP: los 9 archivos nuevos/modificados se transforman sin error; `/admin/perfil` y `/rider/perfil` sirven `200`.

**Limitación de esta verificación (igual que en fases anteriores)**: no hay herramienta de automatización de navegador en este entorno. La interacción visual completa (edición desde la interfaz, toasts, confirmación de SweetAlert2 antes de cambiar la contraseña, cambio de tema en vivo, responsive, dark mode, Sidebar/Navbar en ambos paneles) **no se verificó visualmente por mí** — se verificó por lectura exhaustiva del código y por simulación exacta de las llamadas HTTP subyacentes vía curl. Se recomienda al usuario verificar manualmente antes de dar la fase por cerrada, en ambos paneles.

### URL local del servidor

- Frontend: **http://localhost:5173**.
  - Panel Administrativo: `admin_f7` / `Passw0rd!` → `/admin/perfil`.
  - Panel del Motorizado: `moto_f8` / `Passw0rd!` → `/rider/perfil`.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante.

### Trabajo pendiente (explícitamente fuera de esta fase)

- Avatar con imagen real (el backend no expone ningún campo de foto/URL de avatar — solo iniciales, ver `Avatar`).
- Verificación visual interactiva completa por parte del usuario, en ambos paneles.

**No se avanza a la Fase 12 sin autorización explícita.**

## Bugfix — Dropdowns cortados por contenedores con overflow

**Fecha:** 2026-07-14

### Alcance

Corrección de infraestructura (no una fase numerada): el componente `Dropdown` quedaba visualmente recortado al abrirse dentro de tablas, cards, modales o cualquier layout con scroll. Afectaba a `RowActions` en todos los módulos y al menú de usuario del `Navbar`. Sin funcionalidades nuevas, sin cambios de backend.

### Causa raíz encontrada

El panel de `Dropdown` se renderizaba como `position: absolute`, como hijo directo del propio `wrapper` del componente — es decir, dentro del mismo árbol DOM que el trigger que lo abre (ej. dentro de una `<td>` de `DataTable`).

`DataTable` tiene `overflow-x-auto` en su contenedor (`src/components/datatable/datatable.ts`). Por la regla de CSS de "overflow computado" (cuando un eje se declara distinto de `visible`, el otro eje —aunque no se declare— se computa también como `auto`, nunca se queda en `visible`), esto convierte al contenedor en una caja de recorte en **ambos** ejes, no solo el horizontal. Cualquier descendiente `position: absolute` que se extienda más allá de esos límites queda recortado — exactamente lo que ocurría con el panel del Dropdown de `RowActions`. El mismo mecanismo aplica al `overflow-y-auto` del cuerpo scrolleable de `Modal` (agregado en la Fase 7) y al `overflow-y-auto` de la lista de navegación de `Sidebar`: cualquier Dropdown futuro dentro de esos contenedores habría sufrido el mismo problema. Es el problema clásico y ampliamente documentado de "dropdown atrapado por un ancestro con overflow" — la solución estándar de la industria es un Portal.

### Solución implementada

**Portal a `document.body`**, encapsulado por completo dentro de `Dropdown` (ninguna otra pieza de infraestructura se modificó):

- El panel deja de ser `position: absolute` y pasa a `position: fixed`.
- Al abrir (`open()`), el panel se reubica como hijo directo de `document.body` (escapando de cualquier ancestro con `overflow`), se mide con `getBoundingClientRect()`/`offsetWidth`/`offsetHeight`, y se posiciona con coordenadas `top`/`left` calculadas respecto al `trigger` real.
- Al cerrar (`close()`), tras la animación de salida, el panel **vuelve a su lugar original** dentro de `wrapper` (no se queda huérfano en `document.body`): si la página descarta `wrapper` mientras el Dropdown está cerrado, el panel se descarta con él, sin fugas de memoria ni nodos acumulándose.
- `z-index` del panel elevado a `z-[60]` (por encima del `z-50` del overlay de `Modal`), para que un Dropdown abierto dentro de un modal siempre quede visualmente por encima.

**Posicionamiento inteligente** — nueva utilidad pura y reutilizable `src/utils/floating-position.ts` (`computeFloatingPosition`): calcula `top`/`left` a partir del rect del trigger y el tamaño real del panel, decidiendo:

- Abrir hacia abajo por defecto; si no hay espacio suficiente debajo y sí lo hay arriba, abre hacia arriba.
- Alinear el panel a la derecha o izquierda del trigger según la prop `align`; si eso lo saca de la ventana, invierte la alineación automáticamente.
- Nunca deja que el panel se salga de los bordes de la ventana (recorte final con `Math.max`/`Math.min`).
- Devuelve también `openedUpward`/`alignedRight`, usados para ajustar dinámicamente el `transform-origin` (`origin-top-right`/`origin-top-left`/`origin-bottom-right`/`origin-bottom-left`) y que la animación de apertura se vea natural sin importar hacia qué lado terminó abriendo.

Es una función pura (no toca el DOM, no depende de ningún componente) para que, si en el futuro `Tooltip` u otro componente flotante necesita la misma lógica, se reutilice sin duplicarla — no se modificó `Tooltip` en este bugfix (fuera del alcance reportado, ningún síntoma de recorte descrito para el).

**Reposicionamiento automático**: mientras el Dropdown está abierto, se escuchan `scroll` (en fase de **captura**, sobre `window` — necesario porque el evento `scroll` de un elemento con overflow, como el propio `DataTable`, no burbujea de forma nativa; solo un listener en fase de captura en un ancestro lo detecta) y `resize` (cubre también el zoom del navegador, que dispara `resize`). Ambos listeners se agregan únicamente al abrir y se remueven al cerrar — no quedan activos de forma permanente ni se acumulan entre aperturas.

**Salvaguarda adicional**: si el `trigger` deja de estar conectado al DOM mientras el Dropdown está abierto (ej. la fila de la tabla se descarta por un `reload()` mientras el menú seguía abierto), el propio recálculo de posición detecta `!trigger.isConnected` y cierra el Dropdown automáticamente en vez de dejar un panel flotante huérfano apuntando a un trigger inexistente.

### Comportamiento de cierre (sin cambios de comportamiento, solo de implementación)

Clic afuera, `Escape`, selección de una opción: los tres siguen funcionando exactamente igual. El detector de "clic afuera" se ajustó para reconocer clics dentro del panel aunque ahora viva temporalmente fuera de `wrapper` (`panel.contains(event.target)`, además del `wrapper.contains(...)` original).

### Compatibilidad de API (verificada explícitamente)

`DropdownProps`/`DropdownHandle` no cambiaron. Se confirmó por búsqueda en todo el proyecto que solo dos archivos consumen `Dropdown` directamente (`RowActions`, `Navbar`) y **ninguno de los dos necesitó modificarse** — el fix queda completamente encapsulado dentro de `dropdown.ts`, tal como pedía el alcance.

### Componentes/páginas beneficiados automáticamente

`RowActions` (y por lo tanto, sin tocar ninguna página individual): Usuarios, Tiendas, Sucursales, Clientes, Motorizados, Pedidos, Incidentes, y en el panel del Motorizado, Mis Pedidos e Historial (9 páginas confirmadas por búsqueda en el código). El menú de usuario del `Navbar` (presente en `AdminLayout`/`RiderLayout`, por lo tanto en absolutamente todas las páginas de ambos paneles, incluidos Reportes, Dashboard y Mi Perfil, aunque esas tres no usan `RowActions`).

### Archivos modificados/creados

- `src/utils/floating-position.ts` (nuevo).
- `src/components/dropdown/dropdown.ts` (reescrito).

Ningún otro archivo — ni `DataTable`, ni `ResourceTable`, ni `Modal`, ni ninguna página individual, tal como exigía el alcance ("no modificar las tablas", "no modificar cada página individualmente").

### Verificaciones ejecutadas

`npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`, `npm run build` — los cuatro sin errores. Servidor de desarrollo verificado por HTTP: los archivos nuevo/modificado se transforman sin error.

**Limitación de esta verificación**: no hay herramienta de automatización de navegador en este entorno. La verificación de que los Dropdown ya no se recortan visualmente, el posicionamiento inteligente (apertura hacia arriba/abajo, alineación izquierda/derecha), el reposicionamiento en vivo durante scroll/resize/zoom, y el comportamiento en dark mode/responsive **no se verificó visualmente por mí** — se verificó mediante análisis exhaustivo de la causa raíz (código CSS/DOM real de `DataTable`/`Modal`/`Sidebar`) y revisión completa de la nueva implementación. Se confirmó por búsqueda en el código que el fix alcanza automáticamente a los 9 módulos con `RowActions` y a los menús del `Navbar` en ambos paneles, sin necesitar cambios adicionales. Se recomienda al usuario abrir un Dropdown cerca del borde inferior/derecho de la ventana en varios de los módulos listados para confirmar visualmente el comportamiento antes de dar este bugfix por cerrado.

### URL local del servidor

- Frontend: **http://localhost:5173**.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante.

## Bugfix — Un único Dropdown abierto a la vez

**Fecha:** 2026-07-14

### Causa raíz

Cada llamada a `Dropdown()` crea su propio closure con un `isOpen` **local**, sin ningún registro compartido entre instancias — por diseño, cada Dropdown solo sabía de sí mismo. Al no existir coordinación alguna, era posible abrir el `RowActions` de varias filas (o el de una fila junto con el menú de usuario del `Navbar`) simultáneamente sin que ninguno se enterara de la existencia del otro.

### Solución implementada

Una única variable a nivel de módulo dentro de `dropdown.ts` (`activeDropdownClose: (() => void) | null`), que guarda el `close` del Dropdown actualmente abierto. Como todas las instancias de `Dropdown` se crean llamando a la misma función exportada dentro del mismo módulo, esa variable actúa como un registro compartido sin necesitar una clase "manager", un contexto, ni ningún mecanismo adicional — la opción más simple que cumple el objetivo (KISS/DRY, cero dependencias nuevas).

- Al abrir (`open()`): si ya hay un Dropdown distinto registrado como abierto, se llama a su `close()` antes de continuar, y luego se registra el propio `close` como el activo.
- Al cerrar (`close()`, por cualquier vía — clic afuera, `Escape`, seleccionar una opción, o por haber sido cerrado desde otro `open()`): si el registro apunta a esta misma instancia, se limpia (`null`).

No se recorre el DOM, no se disparan eventos artificiales, no se modifica ningún consumidor.

### Compatibilidad y comportamiento verificado

`DropdownProps`/`DropdownHandle` sin cambios — mismo archivo único modificado (`dropdown.ts`), `RowActions`/`Navbar`/páginas intactos. Se preserva íntegro todo lo de la corrección anterior (Portal, posicionamiento inteligente, reposicionamiento en scroll/resize). Comportamiento trazado manualmente en el código: abrir A → abrir B cierra A automáticamente (síncronamente, antes de que B termine de abrir) → abrir C cierra B — en ningún punto de la ejecución quedan dos instancias con `isOpen = true` a la vez. El toggle sobre el mismo trigger (abrir/cerrar el mismo Dropdown) sigue funcionando sin regresión.

### Archivos modificados

- `src/components/dropdown/dropdown.ts` (único archivo tocado).

### Verificaciones ejecutadas

`npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`, `npm run build` — los cuatro sin errores. Servidor de desarrollo verificado por HTTP sirviendo el archivo actualizado.

**Limitación de esta verificación**: no hay herramienta de automatización de navegador en este entorno — la confirmación visual de "abrir varios Dropdown rápidamente y verificar que nunca coexisten dos abiertos" en los módulos listados (Usuarios, Tiendas, Sucursales, Clientes, Motorizados, Pedidos, Incidentes, Dashboard, Mi Perfil) **no se verificó visualmente por mí**, solo por trazado manual de la lógica en el código. Se recomienda al usuario confirmarlo manualmente.

### URL local del servidor

- Frontend: **http://localhost:5173**.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante.

## Fase 12 — Dashboard Operativo del Motorizado

**Fecha:** 2026-07-14

### Alcance de esta fase

Dashboard real para el panel del Motorizado (`/rider/dashboard`, hasta ahora un placeholder desde la Fase 2). Implementación completamente independiente del Dashboard del Administrador (Fase 10): mismo patrón arquitectónico (servicio fachada dedicado), pero datos, KPIs y widgets propios — orientados exclusivamente al trabajo diario del repartidor, sin ningún indicador administrativo o de negocio.

### Backend revisado antes de implementar

Se revisaron los endpoints ya usados en fases anteriores para el panel del Motorizado (`perfiles-motorizados`, `pedidos`, `reportes/pedidos`, `incidentes`) buscando cuál sirve mejor para "los pedidos de este motorizado". Hallazgo clave: a diferencia de `PedidosService.listar` (`GET /pedidos`, que **no** admite filtrar por `motorizadoId` — la razón por la que Mis Pedidos/Historial, Fase 8, necesitan recorrer todas las páginas con `fetchAllPages`), `ReportesService.reportePedidos` (`GET /reportes/pedidos`) **sí** admite `motorizadoId` como filtro real de backend. Se usó como fuente principal de datos: una sola consulta filtrada trae exactamente los pedidos del motorizado autenticado, ya ordenados `creadoEn: desc` y con `tiendaNombre`/`sucursalNombre` resueltos — mucho más eficiente que recorrer todas las páginas.

### RiderDashboardService (fachada obligatoria)

`src/services/rider-dashboard.service.ts` — único punto que `RiderDashboardPage` consulta. Reutiliza internamente `MotorizadosService`, `ReportesService`, `PedidosService`, `ClientesService`, `IncidentesService` y `SessionService`. Si el backend agrega en el futuro un `GET /dashboard/motorizado`, solo este archivo cambiaría.

### Decisiones técnicas resueltas por razonamiento propio (documentadas, no bloqueantes)

1. **"Pedidos entregados hoy" es una aproximación documentada, no un dato exacto**: `Pedido`/`ReportePedidoItem` solo tienen `creadoEn` (fecha de creación) — el backend no registra la fecha real de entrega en ningún campo. Averiguarla con precisión exigiría consultar el historial de eventos de **cada** pedido entregado (`GET /pedidos/:id/historial`, buscando el evento `cambio_estado` a `entregado`), lo que implicaría N solicitudes redundantes por cada pedido — contrario a la instrucción explícita de evitar consultas repetidas. Se aproxima como "creado hoy y actualmente en estado `entregado`" (documentado en el propio tipo `RiderDashboardKpis` y en el código): puede subestimar un pedido creado un día anterior pero entregado hoy, un caso poco frecuente dado que el ciclo de vida típico de un pedido se completa el mismo día. No se inventó ningún dato: la aproximación usa exclusivamente campos reales (`estado`, `creadoEn`).
2. **"Incidentes registrados" es un total histórico, no de "hoy"**: `Incidente` (`IncidenteResponseDto`) no tiene ningún campo de fecha — no hay forma de acotarlo a un rango temporal sin inventar un dato inexistente. Se muestra el total histórico tal cual, sin fingir que está limitado a "hoy".
3. **Selección de "Mi próximo pedido" — regla FIFO explícita**: de los pedidos activos del motorizado (estados `asignado`, `recogido` o `en_ruta` — cualquiera que todavía requiera una acción suya), se elige el de `creadoEn` más antiguo. Es la interpretación con menos supuestos posible ("atender primero al que lleva más tiempo esperando"), en vez de inventar una jerarquía de urgencia por estado (ej. "en_ruta antes que asignado") que el backend no define en ningún lado.
4. **El detalle completo del próximo pedido requiere una consulta adicional dirigida**: `ReportePedidoItem` no incluye `direccionEntrega` ni `telefonoContacto` (campos que sí pide la tarjeta destacada). Una vez elegido el próximo pedido (paso anterior, sin costo adicional), se hace **una única** llamada a `PedidosService.buscarPorId` (y otra a `ClientesService.buscarPorId` para el nombre del cliente) — nunca por cada fila de la lista, solo para el pedido efectivamente destacado.
5. **"Acciones rápidas" vs. Sidebar**: a diferencia del Dashboard del Administrador (Fase 10, donde toda opción posible ya tenía una entrada en el Sidebar), el Sidebar del Motorizado no tiene ningún ítem de "Incidentes" — por lo que "Registrar Incidente" como acceso rápido no duplica nada. "Ver Mis Pedidos"/"Ver Historial" sí apuntan a rutas ya visibles en el Sidebar; se mantuvieron con el mismo criterio ya aprobado en la Fase 10 (etiquetas de acción, no de sección, aunque el destino final coincida).

### Tipos creados

- `src/types/rider-dashboard.ts` — `RiderDashboardKpis` (5 campos, todos `number | null`), `RiderProximoPedido`, `RiderDashboardData` (incluye `tienePerfil: boolean` para el caso de un usuario motorizado sin perfil operativo, igual que Mis Pedidos/Historial desde la Fase 8).

### Servicio creado

- `src/services/rider-dashboard.service.ts` — `RiderDashboardService.obtenerDashboard()`.

### KPIs implementados (5, con la fórmula exacta de cada uno)

| KPI                    | Fuente                          | Cálculo                                                                    |
| ---------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| Pedidos pendientes     | `reportePedidos` (motorizadoId) | `estado === 'asignado'`                                                    |
| Pedidos en ruta        | `reportePedidos` (motorizadoId) | `estado === 'en_ruta'`                                                     |
| Entregados hoy         | `reportePedidos` (motorizadoId) | `estado === 'entregado' && creadoEn` es hoy (aproximación, ver decisión 1) |
| Atendidos hoy          | `reportePedidos` (motorizadoId) | `creadoEn` es hoy, cualquier estado                                        |
| Incidentes registrados | `incidentes` (motorizadoId)     | `total` (histórico completo, ver decisión 2)                               |

### Widgets implementados

- **KPIs**: 5 `StatCard` (misma infraestructura extendida en la Fase 9: `loading`/`variant`/`description`), con `variant: 'danger'` + "No se pudo obtener" en el indicador puntual que falló.
- **Mi próximo pedido**: `Card` destacada con código, cliente, dirección, teléfono, estado (`Badge`) y un enlace "Ir a Mis Pedidos" (`/rider/mis-pedidos`, navegación SPA). Si no hay ningún pedido activo, `EmptyState` — nunca se inventa un pedido.
- **Mis pedidos recientes**: `DataTable` con los 5 más recientes (cualquier estado) del motorizado autenticado — nunca de otros motorizados (filtrado real de backend por `motorizadoId`, no en el cliente). Sin paginación (mismo criterio que el Dashboard del Administrador: "si basta con mostrar los últimos registros, no paginar").
- **Actividad reciente**: reutiliza el mismo arreglo de pedidos recientes ya obtenido (cero solicitudes adicionales), igual que la decisión ya documentada en la Fase 10 para el Dashboard del Administrador — no existe un endpoint de actividad/historial global, así que se reutiliza la mejor información real disponible.
- **Acciones rápidas**: "Ver Mis Pedidos", "Ver Historial", "Registrar Incidente" (ver decisión 5).

### Componente corregido durante esta fase

Al construir el enlace "Ir a Mis Pedidos" de la tarjeta "Mi próximo pedido" se detectó que anidar un `Button` (que renderiza un `<button>` real) dentro de un `<a data-link>` produce HTML inválido (contenido interactivo anidado en contenido interactivo, prohibido por la especificación HTML5, con comportamiento de foco/clic inconsistente entre navegadores). Se corrigió construyendo el enlace directamente con las clases visuales de `Button` (`BUTTON_VARIANT_CLASSES`, ya exportado desde la Fase 1 para que `IconButton` las reutilice) en vez de anidar el componente — mismo aspecto visual, HTML válido. No se creó ningún componente nuevo.

### Componentes reutilizados sin cambios

`StatCard`, `Card`, `DataTable`, `Loader`, `EmptyState`, `Badge`, `PageHeader`, `Breadcrumb` (vía `PageHeader`), `Section`, `Icon`. Ninguno duplicado ni específico de este módulo.

### Infraestructura reutilizada

`ESTADO_PEDIDO_LABEL`/`ESTADO_PEDIDO_BADGE_VARIANT` (Fase 8), el patrón de servicio fachada (`*DashboardService`, Fase 10), `MotorizadosService.buscarPorUsuarioId` (Fase 8).

### Endpoints consumidos

`GET /perfiles-motorizados` (con `usuarioId`), `GET /reportes/pedidos` (con `motorizadoId`), `GET /incidentes` (con `motorizadoId`), `GET /pedidos/:id`, `GET /clientes/:id`. Ninguno nuevo.

### Limpieza adicional (consecuencia directa de esta fase)

Con `/rider/dashboard` implementado, **ya no queda ninguna ruta placeholder en todo el proyecto** (Admin y Rider tienen pantallas reales en sus 15 rutas combinadas). Se eliminó la función `registerPlaceholder` de `main.ts` (y el import de `PlaceholderPage` que solo ella usaba) al quedar sin ningún llamador — `tsc` la señaló como código muerto. `src/pages/placeholder-page.ts` se conserva como infraestructura disponible para cualquier módulo futuro que empiece sin pantalla real, siguiendo la convención ya documentada en `CLAUDE.md`.

### Pruebas realizadas

Contra el backend real, vía curl reproduciendo exactamente las llamadas de `RiderDashboardService` para la cuenta de prueba `moto_f8` (perfil id 14):

- Resolución del perfil por `usuarioId` (200).
- `reportePedidos` filtrado por `motorizadoId=14` (3 resultados, verificados campo por campo).
- KPIs recalculados a mano a partir de esos 3 resultados y contrastados con la lógica de `computeKpis`: 1 pendiente, 0 en ruta, 0 entregados hoy, 0 atendidos hoy (todos los pedidos de prueba fueron creados un día anterior a la fecha actual del sistema, confirmando que el filtro de "hoy" excluye correctamente datos de otros días), 2 incidentes.
- Selección del próximo pedido (único candidato activo: el `asignado`) y su detalle completo (`GET /pedidos/:id`, `GET /clientes/:id`) verificados contra la respuesta real.
- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` (formateado con `--write`), `npm run build` — los cuatro sin errores.
- Servidor de desarrollo verificado por HTTP: los archivos nuevos/modificados se transforman sin error; `/rider/dashboard` sirve `200`.

**Limitación de esta verificación (igual que en fases anteriores)**: no hay herramienta de automatización de navegador en este entorno. La interacción visual completa (KPIs con estado de carga, tarjeta destacada, tabla, actividad, accesos rápidos, responsive, dark mode) **no se verificó visualmente por mí** — se verificó por lectura exhaustiva del código y simulación exacta de las llamadas HTTP subyacentes vía curl. Se recomienda al usuario verificar manualmente antes de dar la fase por cerrada.

### URL local del servidor

- Frontend: **http://localhost:5173** → `moto_f8` / `Passw0rd!` → `/rider/dashboard`.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante (el único hallazgo real — el `<button>` anidado en `<a>` — se corrigió en el mismo desarrollo de esta fase, ver arriba).

### Trabajo pendiente (explícitamente fuera de esta fase)

- Verificación visual interactiva completa por parte del usuario.

## Fase 13 — Responsive Completo (Desktop, Tablet y Mobile)

Adaptación integral del frontend (Admin + Rider + páginas generales) a Desktop/Tablet/Mobile, sin tocar backend/base de datos ni agregar funcionalidades nuevas. Objetivo explícito: Desktop conserva exactamente el diseño actual; Mobile/Tablet dejan de requerir zoom o scroll horizontal salvo donde el propio brief lo autoriza (tablas del panel Administrador).

### Hallazgo de partida: no existía navegación en mobile

El `Sidebar` se ocultaba por completo por debajo de `lg` (`hidden ... lg:flex`) y no existía ningún disparador alternativo — por debajo de 1024px de ancho, ningún usuario (Admin ni Motorizado) tenía forma de navegar entre módulos. Esta fase lo resuelve como prioridad número uno.

### Archivos modificados (componentes/infraestructura compartida)

- `index.html` — `viewport-fit=cover` agregado al meta viewport (requisito indispensable para que `env(safe-area-inset-*)` resuelva a un valor distinto de cero; sin este flag, todos los `env()` usados más abajo son siempre `0`, es decir, transparentes en cualquier navegador/dispositivo sin notch).
- `src/components/sidebar/sidebar.ts` — reescrito para comportarse como Drawer por debajo de `lg` (ver detalle abajo). Mismo componente, mismo array de `items`; cero duplicación entre Admin y Rider.
- `src/components/navbar/navbar.ts` — nuevo prop opcional `onMenuClick`; si se provee, renderiza un botón hamburguesa (`Menu` de lucide) visible solo `lg:hidden`, antes del logo. `AuthLayout` no lo usa (no tiene Sidebar) y sigue funcionando sin cambios. Altura fija `h-16` reemplazada por `min-h-16` + `padding` (ver Safe Areas).
- `src/layouts/admin/admin-layout.ts` / `src/layouts/rider/rider-layout.ts` — el `Sidebar` se construye antes que el `Navbar` (para poder pasarle `onMenuClick: () => sidebar.toggleDrawer()`); `mount` recibe padding horizontal consciente de Safe Area.
- `src/layouts/auth/auth-layout.ts` — mismo tratamiento de Safe Area que Admin/Rider (no tiene Sidebar, pero sí header/footer que tocan los bordes de la pantalla).
- `src/components/footer/footer.ts`, `src/components/modal/modal.ts` — padding con Safe Area (ver sección dedicada).
- `src/components/datatable/datatable.ts` — nueva estrategia responsive automática (ver detalle abajo).
- `src/components/button/icon-button.ts`, `src/components/pagination/pagination.ts`, `src/components/checkbox/checkbox.ts` — mejoras de área táctil (ver sección dedicada).
- `src/components/report-filters/report-filters.ts` — corrección de un desbordamiento horizontal real en 320-375px (ver Bugs encontrados).
- `src/components/tooltip/tooltip.ts` — corrección de posible desbordamiento de viewport (ver Bugs encontrados).
- `src/pages/rider/mis-pedidos/confirmar-entrega-form.ts` — corrección de un desbordamiento horizontal real en la fila de foto (ver Bugs encontrados).

### Sidebar → Drawer (Fase 13): un único componente, dos comportamientos por breakpoint

- **Desktop (`lg` y superior)**: exactamente el mismo comportamiento colapsable de la Fase 2 (barra estática, botón "Colapsar", estado persistido en `localStorage`). Cero cambios visuales.
- **Mobile/Tablet (`< lg`)**: el mismo `<aside>` pasa a ser `position: fixed`, oculto fuera de pantalla (`-translate-x-full`) por defecto, con un backdrop semitransparente. Se abre con `sidebar.toggleDrawer()` (invocado por el botón hamburguesa del `Navbar`) y se cierra: (a) al elegir cualquier opción de navegación, (b) al tocar el backdrop, (c) con `Escape`, (d) con el botón "X" propio del Drawer (visible solo en mobile). Transición de 200ms, mismo lenguaje de animación que `Modal`.
- El estado "colapsado" (icono-solo) es exclusivo de Desktop: en el Drawer las etiquetas de texto siempre son visibles, sin importar el valor persistido — se logra alternando la clase `lg:hidden` (no `hidden`) sobre las etiquetas.
- **Arquitectura sin duplicar el layout de Admin/Rider**: `SidebarHandle.element` es ahora un `<div class="contents">` que envuelve `<aside>` + backdrop. `display: contents` hace que ese wrapper no participe del `flex` de `AdminLayout`/`RiderLayout` — sus hijos se comportan como si fueran hijos directos, exactamente como antes de esta fase. Ningún layout necesitó reestructurarse más allá de pasar `onMenuClick`.

### DataTable: estrategia responsive única para todo el proyecto

- **Decisión**: por debajo de `sm` (640px), la tabla se sustituye automáticamente por una lista de tarjetas apiladas — una tarjeta por fila, generada a partir de las mismas `columns` que ya recibía `DataTable`. **Ninguna página cambió una sola línea**: es una capacidad nueva del componente compartido, no una solución por página.
- **Regla de generación de la tarjeta** (deducida de la convención ya presente en las ~10 tablas del proyecto, verificada antes de implementar): la primera columna con `header` no vacío es el título de la tarjeta; una columna con `header: ''` (la convención ya usada en todo el proyecto para alojar `RowActions`) se ubica junto al título; el resto se apila como pares "etiqueta: valor". No se omite ninguna columna — mismo contenido exacto que la tabla, solo con otra disposición visual.
- **Ambos árboles (tabla y lista de tarjetas) conviven en el DOM**; Tailwind (`hidden sm:block` / `sm:hidden`) decide cuál se ve según el ancho de pantalla — sin JavaScript, sin `resize` listeners, sin riesgo de desincronización entre el estado "que se ve" y el ancho real de la ventana.
- **Admin conserva también, en tablas anchas, la opción de scroll horizontal** (el `overflow-x-auto` del wrapper no se quitó): en `sm`-`lg` con muchas columnas, la tabla real (no la de tarjetas) sigue siendo la que se ve, y sigue pudiendo scrollear horizontalmente si hace falta — el brief autoriza explícitamente esta solución para el panel Administrativo.
- Estados de `loading`/`error`/`vacío` no se duplicaron (siguen usando `Skeleton`/`EmptyState` tal cual, ya responsive por sí mismos) — solo la fila de datos real tiene doble representación.
- `Dropdown` (usado por `RowActions` dentro de la celda/tarjeta de acciones) no requirió ningún cambio: al ser un Portal a `document.body` (Fase 11/Bugfix), funciona igual sin importar si su trigger vive dentro de un `<td>` o de una tarjeta.

### Touch targets (44×44 aproximado, sin alterar el diseño Desktop)

- **`IconButton` tamaño `md`** (usado en `Navbar`: tema, notificaciones, hamburguesa): de 40px a 44px (`h-11 w-11`) — único tamaño exacto a la recomendación, cambio de 4px prácticamente imperceptible en Desktop.
- **`IconButton` tamaño `sm`** (usado en `RowActions`, foto a eliminar en "Confirmar entrega"): se mantiene visualmente en 32px (agrandarlo rompería el ritmo vertical de filas densas de tabla), pero gana un área de toque invisible de 44×44 centrada vía un pseudo-elemento `::before` (`before:absolute before:h-11 before:w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']`) — técnica recomendada explícitamente por el brief ("incrementar únicamente el área clicable mediante padding o ajustes de layout"). Se aplicó solo donde el botón está aislado (nunca pegado a otro control), para no generar zonas invisibles superpuestas entre botones vecinos.
- **`Pagination`**: los botones de página pasaron de 32px a 36px reales (no área invisible): al estar pegados unos a otros, un área de toque invisible se superpondría entre botones vecinos y causaría pulsaciones accidentales — se priorizó la recomendación del propio brief de "separación suficiente entre elementos táctiles" sobre el método de padding invisible.
- **`Checkbox`**: la fila `<label>` (checkbox de 16px + texto) ganó `py-2` — el checkbox visual no cambia de tamaño, pero toda la fila (la que realmente recibe el toque, al ser un `<label>`) es más alta.
- **`Sidebar`/Drawer**: los ítems de navegación pasaron de `py-2` a `py-2.5`; el botón de cerrar el Drawer es `h-11 w-11` (44px) — el panel del Motorizado, con prioridad absoluta según el brief, es el principal beneficiario (es su única navegación en mobile).

### Safe Areas (notch / Dynamic Island / barras gestuales)

- Se agregó `viewport-fit=cover` en `index.html` (requisito técnico de la spec CSS `env()` — sin él, todos los valores son `0` igualmente, o sea, transparente para cualquier dispositivo actual sin PWA/notch).
- Aplicado con `env(safe-area-inset-*)` (siempre combinado con `max()`/`calc()` sobre el padding ya existente, nunca reemplazándolo — así el valor final en un dispositivo sin notch es idéntico al de antes de esta fase): `Navbar` (top), `Footer` (bottom), `AuthLayout` header (top) y su contenedor central (left/right), `Sidebar` Drawer (bottom/left, solo mobile), `Modal` (los 4 lados, mobile con el panel a pantalla casi completa), `mount` de Admin/Rider (left/right, para landscape con notch lateral).
- **Efecto en cualquier navegador/dispositivo sin notch (Desktop y la inmensa mayoría de móviles hoy)**: exactamente cero — `env(safe-area-inset-*)` vale `0`, y `max(1rem, 0)` = `1rem`, el mismo padding que ya existía.
- No se agregó ningún manifest/configuración PWA nueva (fuera de alcance) — la implementación queda lista para el caso en que el proyecto se instale como PWA en un dispositivo con notch, sin ningún efecto visual mientras eso no ocurra.

### Formularios y Modal: ya cumplían sin cambios

- **Formularios**: los ~10 formularios del proyecto (`buildUsuarioForm`, `buildPedidoForm`, etc.) ya usan `flex flex-col gap-4` (una sola columna) en todos los casos — ya se apilan verticalmente en mobile y no generan scroll horizontal. No existía ningún formulario con grid multi-columna que "romper" en mobile, así que no se introdujo ninguno nuevo (el brief permite pero no exige columnas en Desktop; agregar una hoy sería un cambio visual de Desktop no solicitado).
- **Modal**: ya usaba `w-full` + `max-h-[85vh]` + `overflow-y-auto` interno (corrección de la Fase 7) — en mobile el panel ya ocupa el ancho casi completo (menos el margen de seguridad `p-4`) con scroll interno y sin cortar contenido. Esta fase solo le agregó Safe Area (ver arriba); ningún otro cambio fue necesario.

### Bugs de responsive encontrados y corregidos (código ya existente, no introducidos por Fase 12)

1. **`ReportFilters` (usado por los 3 Reportes): el par de campos "Desde"/"Hasta" no envolvía.** Cada campo medía `w-40` (10rem) dentro de un `flex gap-3` sin `flex-wrap`: en 320-375px de ancho, el par completo (20rem + gap) no entraba en una sola fila y generaba scroll horizontal / requería zoom. Corregido: `flex-wrap` en el contenedor del par + anchos `w-36 sm:w-40` (en mobile, si no entran uno junto al otro, "Hasta" pasa a la línea siguiente en vez de desbordar). Los campos `select`/`search` de `ReportFilters` (`w-52`/`w-56`) se dejaron con `w-full max-w-56` como base, `sm:w-52`/`sm:w-56` desde tablet — incluso dentro de su contenedor ya-wrap, un ancho fijo podía acercarse al límite en 320px exactos.
2. **`Tooltip`: sin límite de ancho ni consciencia del viewport.** A diferencia de `Dropdown` (Portal + `computeFloatingPosition`, Fase 11), `Tooltip` es puramente CSS (`group-hover`) y no mide el espacio disponible; un `content` largo cerca de un borde angosto podía salirse de la pantalla. Corregido con `max-w-[calc(100vw-1rem)]` + `whitespace-normal` (antes `whitespace-nowrap` sin límite) — no se migró a Portal (uso exclusivamente de hover/Desktop, en el Drawer mobile el Sidebar siempre muestra las etiquetas completas y el Tooltip no llega a dispararse).
3. **`confirmar-entrega-form.ts` (panel del Motorizado, pantalla de "Confirmar entrega"): la fila de cada foto no envolvía.** `Input` (flexible) + `Checkbox` "Principal" + botón eliminar convivían en un `flex items-end gap-3` sin `flex-wrap` ni `min-w-0` en el input — en 320-375px el campo de URL quedaba comprimido a un ancho iletgible o la fila desbordaba. Corregido: `flex-wrap` + `min-w-0` en el input + `basis-full sm:basis-auto` (en mobile el campo URL ocupa toda la fila y el par checkbox/eliminar pasa a la línea siguiente; en Desktop, comportamiento idéntico al anterior).

### Componentes/páginas auditados sin cambios necesarios

Revisión exhaustiva de todas las páginas listadas en el alcance (Dashboard/Usuarios/Tiendas/Sucursales/Clientes/Motorizados/Pedidos/Incidentes/Reportes/Mi Perfil en Admin; Dashboard/Mis Pedidos/Historial/Mi Perfil en Rider; Login) y de los componentes generales restantes (`Textarea`, `DetailList`, `EmptyState`, `Loader`, `Skeleton`, `Toast`, `Alert`, `Icon`, `RowActions`, formularios de Tiendas/Sucursales/Clientes/Motorizados, `PedidoFotos`, `PedidoHistorial`, `IncidenteForm`, Reporte de Entregas/Productividad): todos ya usaban grids con quiebre responsive (`grid-cols-1 sm:grid-cols-2 ...`), `ResourceTable`/`DataTable` (ahora responsive por herencia, sin cambios propios) o `flex-wrap`, sin anchos fijos fuera de un contenedor que envuelva. No se modificó ninguno.

### Pruebas realizadas

- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --write .` (solo reformateo, sin cambios funcionales), `npm run build` — los cuatro sin errores.
- Verificación de que las utilidades de Tailwind nuevas/menos habituales realmente compilaron en el CSS de producción (`display:contents`, pseudo-elementos `::before` con `content:var(--tw-content)`, los 4 `env(safe-area-inset-*)`, `-translate-x-full`, `h-11`, `min-h-16`) — confirmado en `dist/assets/index-*.css`.
- Servidor de desarrollo y backend verificados por HTTP (`200` en ambos) tras todos los cambios.

**Limitación de esta verificación (igual que en fases anteriores)**: no hay herramienta de automatización de navegador en este entorno. La verificación visual real en los anchos pedidos (320/360/375/390/414/768/1024/1280/1440px), landscape/portrait y dark mode **no se realizó visualmente por mí** — se hizo por lectura exhaustiva de cada archivo tocado, del CSS compilado, y razonamiento explícito sobre el comportamiento de cada clase Tailwind en cada breakpoint. Se recomienda al usuario verificar manualmente antes de dar la fase por cerrada.

### URL local del servidor

- Frontend: **http://localhost:5173**.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante. Los 3 bugs de responsive preexistentes (`ReportFilters`, `Tooltip`, `confirmar-entrega-form.ts`) se corrigieron en el mismo desarrollo de esta fase, ver sección dedicada arriba.

### Trabajo pendiente (explícitamente fuera de esta fase)

- Verificación visual interactiva completa por parte del usuario en los anchos/orientaciones/temas listados en el brief.
- Auditoría final: **no se inicia sin autorización explícita del usuario** (instrucción explícita del cierre de esta fase).

**No se avanza a la auditoría final sin autorización explícita.**

## Fase 15 — Corrección de Hallazgos Críticos de Auditoría

Corrige exclusivamente el hallazgo C4 de `AUDIT_REPORT.md` (raíz del
repositorio): `Modal` y `Dropdown` no gestionaban el foco en absoluto,
bloqueando por completo la navegación por teclado en los flujos
Crear/Editar/Eliminar de todo el proyecto. Ninguna funcionalidad nueva,
ningún consumidor de `Modal`/`Dropdown` modificado.

### Diagnóstico confirmado

Ni `Modal.open()` ni `Dropdown.open()` movían el foco a su contenido,
ni lo devolvían al disparador al cerrar, ni implementaban un focus
trap. Ambos, además, reubican su panel como hijo directo de
`document.body` al abrirse — así que, abierto por teclado, la
siguiente pulsación de `Tab` no entraba al panel: continuaba desde la
posición original del disparador en el DOM, saltándose por completo el
contenido reubicado al final de `<body>`. Un usuario que navega solo
con teclado no podía completar ningún flujo de Crear/Editar (`FormModal`)
ni operar ninguna acción de fila (`RowActions`) sin retroceder
manualmente con `Shift+Tab` desde el final de toda la página.

### Corrección aplicada

**`src/utils/focus-trap.ts`** (nuevo, reutilizado por ambos componentes
— cero duplicación):

- `focusFirstElement(container)`: mueve el foco al primer elemento
  enfocable de `container` (o al propio `container`, con `tabindex="-1"`,
  si no contiene ninguno). Se llama una vez al abrir.
- `trapTabKey(event, container)`: si `Tab`/`Shift+Tab` está por sacar
  el foco de `container`, lo redirige al primer/último elemento
  enfocable — implementa el focus trap. Se invoca desde el `keydown`
  que cada componente ya mantenía mientras está abierto (no se agregó
  un listener nuevo, solo una línea más de manejo dentro del existente,
  junto al `Escape` que ya cerraba el panel).
- `restoreFocus(container, trigger)`: devuelve el foco a `trigger` al
  cerrar — pero **únicamente si el foco todavía está dentro de
  `container` en ese momento**. Esta guarda evita un bug de orden real
  detectado durante el desarrollo: un item de `Dropdown` cuyo
  `onSelect` abre un `Modal` (ej. "Editar" en `RowActions`) ejecuta
  `onSelect()` antes de `close()` — para cuando `Dropdown.close()`
  corre, el foco ya está dentro del `Modal` recién abierto, y sin esta
  guarda `restoreFocus` se lo hubiera "robado" de vuelta al disparador
  del `Dropdown` ya cerrado, detrás del modal.

**`Modal`** (`src/components/modal/modal.ts`): el panel gana
`tabindex="-1"` (foco de respaldo) y `focus:outline-none` (el navegador
ya no dibuja un anillo de foco visible sobre todo el panel al recibir
foco programático). `open()` guarda `document.activeElement` como
disparador y llama `focusFirstElement(panel)`; `close()` llama
`restoreFocus(panel, previouslyFocused)`. El `keydown` existente
(que ya manejaba `Escape`) ahora también delega en `trapTabKey`.

**`Dropdown`** (`src/components/dropdown/dropdown.ts`): mismo patrón
exacto — `tabindex="-1"` + `focus:outline-none` en el panel, disparador
guardado en `open()`, `focusFirstElement`/`restoreFocus`/`trapTabKey`
en los mismos puntos. El Portal a `document.body`, el posicionamiento
inteligente (`computeFloatingPosition`), el registro de "un único
Dropdown abierto a la vez" (`activeDropdownClose`), el responsive y el
dark mode no se tocaron — la corrección es exclusivamente de foco.

### Por qué se beneficia todo el proyecto sin tocar consumidores

`FormModal`, `RowActions`, el menú de usuario del `Navbar`, y cualquier
otro punto que ya construye un `Modal`/`Dropdown` heredan la corrección
automáticamente: la API pública (props, `ModalHandle`/`DropdownHandle`)
no cambió. Cero archivos de página o de otro componente modificados.

### Pruebas realizadas

- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`,
  `npm run build` — los cuatro sin errores.
- Revisión manual del flujo de foco trazando el código (no hay
  automatización de navegador en este entorno): abrir un `FormModal`
  desde un botón de la página → foco inicial cae en el botón "Cerrar"
  (primer elemento enfocable en el DOM del panel, comportamiento base
  recomendado por WAI-ARIA APG cuando no hay un campo obviamente
  primario) → `Tab` recorre los campos del formulario y el
  footer → `Tab` desde el último botón del footer vuelve al primero
  (`Cerrar`) → `Shift+Tab` desde `Cerrar` va al último → `Escape`
  cierra y devuelve el foco exactamente al botón que abrió el modal.
  Mismo trazado para `Dropdown` (ej. `RowActions` de cualquier listado):
  abrir con teclado enfoca el primer ítem del menú, `Tab`/`Shift+Tab`
  quedan atrapados dentro del menú, `Escape` cierra y devuelve el foco
  al botón de acciones (⋮) de esa fila.
- Caso de la guarda de `restoreFocus` verificado por lectura: en
  `RowActions`, "Editar" ejecuta `onSelect()` (que abre un `FormModal`)
  antes de que `Dropdown.close()` corra — confirmado que, en ese
  momento, el foco ya está dentro del nuevo `Modal` y `restoreFocus`
  del `Dropdown` correctamente no interviene (su propio `container` ya
  no contiene `document.activeElement`).
- No-regresión verificada por lectura de los consumidores existentes
  (ninguno modificado): `FormModal` (Crear/Editar en los 6+ módulos
  administrativos), `RowActions` en cada listado, menú de usuario del
  `Navbar`, `Sidebar`/Drawer (que usa `Tooltip`, no `Dropdown` — sin
  relación con este cambio), Dashboards, Responsive (Fase 13, sin
  tocar), Dark Mode (clases `dark:` no modificadas).

**Limitación de esta verificación**: no hay herramienta de
automatización de navegador en este entorno — la verificación de
`Tab`/`Shift+Tab`/`Escape` reales con un lector de pantalla no se hizo
de forma interactiva por mí. Se recomienda al usuario una prueba manual
de teclado antes de dar el hallazgo por definitivamente cerrado.

### URL local del servidor

- Frontend: **http://localhost:5173**.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante.

**El proyecto se da por finalizado al cerrar esta fase**, según
instrucción explícita: no se buscan nuevos problemas ni se agregan
mejoras adicionales más allá de los 4 hallazgos críticos de la
auditoría.

## Fase 16 — Incorporación de `nombres`/`apellidos` al modelo Usuario

El backend agregó `nombres`/`apellidos` (obligatorios) a `Usuario`
(ver `Backend/DEVELOPMENT_PROGRESS.md`, Fase 14). Esta fase adapta el
frontend a ese contrato ya existente — no agrega funcionalidades ni
modifica el flujo de login (`identificador` + `password`, sin cambios).

### Utilidad nueva: una única fuente de verdad para el nombre completo

`src/utils/nombre-completo.ts` (`nombreCompleto({ nombres, apellidos })`)
es la **única** función del proyecto que concatena ambos campos.
Reutilizada en los 4 puntos donde el frontend necesita mostrar el
nombre completo de una persona — ninguno concatena `nombres`/`apellidos`
a mano.

### Regla aplicada para decidir dónde mostrar el nombre completo vs. el `usuario`

Por cada pantalla que ya mostraba `usuario`, se evaluó el contexto antes
de tocarla — nunca se reemplazó indiscriminadamente:

| Pantalla                                                                                       | Contexto                                                                                                                                                                                                                                                                                     | Decisión                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Navbar` (avatar, menú de usuario, `aria-label`)                                               | Identifica a la persona que inició sesión                                                                                                                                                                                                                                                    | **Cambia** a `nombreCompleto` (vía `AdminLayout`/`RiderLayout`, que ahora pasan `userName: nombreCompleto(currentUser)` en vez de `currentUser.usuario`)                      |
| `Mi Perfil` (encabezado con Avatar + nombre grande)                                            | Pantalla de la propia persona                                                                                                                                                                                                                                                                | **Cambia** a `nombreCompleto`; el campo `usuario` (login) se mantiene como campo de formulario aparte, sin eliminarse                                                         |
| Tabla de **Usuarios** (admin)                                                                  | Listado de cuentas, pero de personas reales                                                                                                                                                                                                                                                  | **Se agrega** una columna "Nombre completo" (primera columna, ahora el título de la tarjeta móvil — Fase 13) sin quitar la columna "Usuario" (identificador técnico de login) |
| Detalle/confirmaciones de **Usuarios** (`DetailList`, diálogos de activar/desactivar/eliminar) | Confirman una acción sobre una persona                                                                                                                                                                                                                                                       | **Cambia** a `nombreCompleto` en el texto de confirmación; el detalle sigue mostrando `Nombres`/`Apellidos`/`Usuario` por separado (vista técnica completa)                   |
| Selector de cuenta en **Motorizados** (`usuario — correo`)                                     | Vincular una `PerfilMotorizado` a una cuenta de login existente — selección técnica/administrativa, no una pantalla de la lista explícita del brief                                                                                                                                          | **Sin cambios** — se revisó explícitamente y se decidió mantener, para no modificar nada fuera del alcance mínimo pedido                                                      |
| Login                                                                                          | Solo pide `identificador`/`password`                                                                                                                                                                                                                                                         | **Sin cambios** (instrucción explícita)                                                                                                                                       |
| Sidebar/Drawer                                                                                 | Solo enlaces de navegación, nunca mostró identidad del usuario                                                                                                                                                                                                                               | **Sin cambios** (revisado, no aplica)                                                                                                                                         |
| Dashboard Admin/Rider, Reportes, Historial, Mis Pedidos                                        | Se revisaron explícitamente (`grep` de `currentUser`/`getCurrentUser` en todo `src/`): el usuario autenticado solo se usa para obtener su `id` (`usuarioId`/`creadoPorId`/`motorizadoId` en llamadas a la API) — ninguna de estas pantallas muestra el nombre del usuario actual en absoluto | **Sin cambios** (nada que adaptar)                                                                                                                                            |

### Archivos modificados

- `src/utils/nombre-completo.ts` (nuevo)
- `src/types/usuario.ts` — `Usuario`, `CreateUsuarioPayload`, `UpdateUsuarioPayload` ganan `nombres`/`apellidos`
- `src/types/auth.ts` — `AuthUser` gana `nombres`/`apellidos`
- `src/services/profile.service.ts` — `ActualizarPerfilPayload` gana `nombres`/`apellidos`
- `src/pages/admin/usuarios/usuario-form.ts` — campos Nombres/Apellidos (obligatorios, máx. 100), antes del campo Usuario
- `src/pages/admin/usuarios/usuarios.page.ts` — columna "Nombre completo", detalle, textos de confirmación, payloads de crear/editar
- `src/pages/profile/profile.page.ts` — campos Nombres/Apellidos en el formulario, encabezado con `nombreCompleto`
- `src/layouts/admin/admin-layout.ts` / `src/layouts/rider/rider-layout.ts` — `userName` del `Navbar` ahora usa `nombreCompleto`

**Sin cambios** (confirmado por revisión, no por omisión): `src/services/usuarios.service.ts`, `src/services/auth.service.ts`, `src/services/session.service.ts` (los tres son genéricos/tipados, heredan los campos nuevos sin tocar su lógica), `src/components/navbar/navbar.ts` (ya recibía `userName` por prop), `Sidebar`, `Dropdown`, `Modal`, `DataTable` (sin relación con este cambio), `login.page.ts`, todas las páginas de Dashboard/Reportes/Historial/Mis Pedidos.

### Responsive

Verificado por lectura de código: la nueva columna "Nombre completo" de
la tabla de Usuarios hereda automáticamente el comportamiento de
`DataTable` (Fase 13) — al ser ahora la primera columna con `header` no
vacío, es el título de la tarjeta en la vista móvil (`< sm`), sin
ningún cambio adicional. Los 2 campos nuevos de los formularios
(Usuario y Mi Perfil) son `Input` estándar dentro de un `flex flex-col
gap-4` ya existente — se apilan verticalmente igual que el resto de
campos, sin requerir ajuste.

### Pruebas realizadas

- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .` (sin
  cambios de formato), `npm run build` — los cuatro sin errores.
- Verificado contra el backend real: `POST /usuarios` con
  `nombres`/`apellidos`, `POST /auth/register`, `POST /auth/login`
  (respuesta incluye los campos nuevos), `PATCH /usuarios/:id` parcial —
  ver detalle completo en `Backend/DEVELOPMENT_PROGRESS.md` Fase 14.
- Regresión: `GET /reportes/*`, `GET /perfiles-motorizados` sin cambios.

**Limitación de esta verificación**: no hay herramienta de
automatización de navegador en este entorno — la interacción visual
completa (formularios, tabla, Mi Perfil, Navbar, responsive) no se
verificó visualmente por mí, solo por lectura exhaustiva del código y
simulación de las llamadas HTTP subyacentes.

### URL local del servidor

- Frontend: **http://localhost:5173**.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante. Nota esperada (no un problema): las cuentas de
prueba existentes antes de esta fase muestran `"Pendiente Pendiente"`
como nombre completo (valor de backfill de la migración) hasta que un
administrador las edite con nombres reales vía Mi Perfil o el CRUD de
Usuarios.

## Fase 17 — Representación Unificada del Motorizado

El backend extendió `PerfilMotorizadoResponseDto` y
`ReporteMotorizadoItemDto` con `nombres`/`apellidos` (ver
`Backend/DEVELOPMENT_PROGRESS.md`, Fase 15). Esta fase adapta el
frontend para que ningún motorizado se identifique jamás únicamente por
su placa — siempre "Nombre Completo · Placa". Ninguna funcionalidad
nueva, ninguna lógica de negocio ni relación de datos modificada.

### Utilidad compartida

**`src/utils/format-motorizado.ts`** (`formatMotorizado(motorizado)`):
única función del proyecto que define la representación de un
motorizado. Reutiliza `nombreCompleto` (Fase 16, no duplica la
concatenación de `nombres`/`apellidos`) y agrega `· placa`. Devuelve un
string de una sola línea ("Carlos Rojas · F8-0002"), usado tal cual en
Selects, columnas de `DataTable` y `DetailList`. Para un componente que
necesite dos líneas, la recomendación (documentada en el propio archivo)
es reutilizar `nombreCompleto(motorizado)` y `motorizado.placa` por
separado en vez de crear una segunda función — no hizo falta en esta
fase porque ningún componente actual necesitó esa variante.

### Regla aplicada: dónde sí y dónde no

Se revisó cada pantalla donde aparece un motorizado antes de tocarla:

| Pantalla                                                                    | Antes                                            | Después                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pedidos: Select "Asignar/Reasignar motorizado"                              | `${placa} (${estado})`                           | `${formatMotorizado(motorizado)} (${estado})` — se conserva el estado operativo (disponible/ocupado/inactivo) porque ya era información útil para elegir a quién asignar, no se quita nada existente                                                                        |
| Pedidos: detalle "Motorizado asignado"                                      | igual que el Select                              | igual que el Select (mismo mapa de labels)                                                                                                                                                                                                                                  |
| Historial del Pedido (`PedidoHistorial`, compartido por Admin y Motorizado) | `#${motorizadoId}` (id crudo)                    | `formatMotorizado`, vía un resolver `motorizadoLabel` que el componente ahora exige como segundo parámetro obligatorio — cada llamador (Pedidos admin, Mis Pedidos, Historial del Motorizado) construye el suyo a partir de una lista de motorizados ya cargada             |
| Reporte de Pedidos / Reporte de Entregas: columna "Motorizado" y filtro     | `placa`                                          | `formatMotorizado(motorizado)`                                                                                                                                                                                                                                              |
| Reporte de Productividad: columna y filtro                                  | `placa`                                          | `formatMotorizado(row)` (la propia fila del reporte ya trae `nombres`/`apellidos`, sin fetch adicional)                                                                                                                                                                     |
| Incidentes: columna "Motorizado" y detalle                                  | `#${motorizadoId}` (id crudo, ni siquiera placa) | `formatMotorizado`, vía una lista de motorizados cargada al montar la página (nueva, esta pantalla no tenía ninguna referencia previa)                                                                                                                                      |
| Motorizados (CRUD propio del perfil)                                        | columnas separadas "Usuario"/"Placa"             | **Sin cambios** — la placa es un campo nativo del propio registro que se administra ahí (no es "identificar a un motorizado en otro contexto"); la columna "Usuario" ya fue una decisión explícita de la Fase 16 (contexto técnico/administrativo de vinculación de cuenta) |
| Dashboard Admin/Rider, Mis Pedidos (rider)                                  | —                                                | **Sin cambios** — revisados explícitamente (`grep` de "motorizado" en ambos dashboards y en Mis Pedidos): ninguno muestra el nombre de un motorizado (Admin solo agrega un conteo `motorizadosActivos`; Rider siempre ve sus propios datos, nunca los de otro motorizado)   |

### Archivos modificados

- `src/utils/format-motorizado.ts` (nuevo)
- `src/types/perfil-motorizado.ts`, `src/types/reporte.ts` — agregan `nombres`/`apellidos`
- `src/pages/admin/pedidos/pedidos.page.ts`
- `src/pages/admin/pedidos/pedido-historial.ts` — `PedidoHistorial` gana el parámetro obligatorio `motorizadoLabel`
- `src/pages/rider/mis-pedidos/mis-pedidos.page.ts`, `src/pages/rider/historial/historial.page.ts` — agregan la carga de motorizados (ya cargaban clientes/sucursales/tiendas con el mismo patrón) para poder resolver `PedidoHistorial`
- `src/pages/admin/reportes/reporte-pedidos.page.ts`, `reporte-entregas.page.ts`, `reporte-motorizados.page.ts`
- `src/pages/admin/incidentes/incidentes.page.ts` — primera vez que esta página carga una lista de referencia (motorizados) al montar

### Componentes reutilizados (sin crear ninguno nuevo)

`DataTable`, `DetailList`, `ResourceTable`, `Select`, `Dropdown` (sin cambios, `RowActions` ya funciona igual), `FormModal`.

### Responsive y Dark Mode

Verificado por lectura de código: la cadena más larga ("Nombre Completo
· Placa") se renderiza siempre dentro de celdas/`<option>`/`DetailList`
que ya envuelven texto sin `whitespace-nowrap` ni truncado forzado — la
vista de tarjeta móvil de `DataTable` (Fase 13) ya usa esta misma celda
como título de tarjeta sin límite de ancho, así que el texto simplemente
envuelve en una línea adicional en pantallas angostas, sin romper el
layout. Ningún color ni clase `dark:` se tocó — no hay superficie nueva
de dark mode que verificar.

### Pruebas realizadas

- `npx tsc --noEmit`, `npx eslint .`, `npx prettier --write .` (1 archivo
  reformateado, sin cambio funcional), `npm run build` — los cuatro sin
  errores.
- Verificado contra el backend real: se asignaron nombres reales
  ("Miguel Torres", "Carlos Rojas") a dos motorizados de prueba vía
  `PATCH /usuarios/:id` y se confirmó que `GET /perfiles-motorizados` y
  `GET /reportes/motorizados` reflejan el cambio de inmediato — ver
  detalle en `Backend/DEVELOPMENT_PROGRESS.md` Fase 15.
- Regresión: ningún consumidor existente de `PerfilMotorizado`/
  `ReporteMotorizadoItem` se rompió (solo se agregaron campos a los
  tipos).

**Limitación de esta verificación**: no hay herramienta de
automatización de navegador en este entorno — la verificación visual
de Selects/tablas/detalle/responsive no se hizo de forma interactiva
por mí, solo por lectura exhaustiva del código y de las respuestas
reales del backend.

### URL local del servidor

- Frontend: **http://localhost:5173**.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante.

## Fase 18 — Infraestructura de Exportación de Reportes

El backend agregó 3 endpoints nuevos (`GET /reportes/{pedidos,entregas,motorizados}/export`, ver `Backend/DEVELOPMENT_PROGRESS.md` Fase 16) que devuelven el reporte ya generado en `xlsx`/`pdf`/`csv`/`json`/`xml`. Esta fase consume esos endpoints: un único botón "Exportar" (Dropdown de 5 formatos) reutilizado por los 3 reportes existentes — el frontend nunca genera el archivo, solo lo pide y lo descarga.

### Componente nuevo

**`src/components/export-button/export-button.ts`** (`ExportButton`): compone `Button` (trigger, icono `Download`, variante `outline`) + `Dropdown` (5 items, uno por formato) tal cual existen — no crea variantes nuevas de ninguno de los dos. Recibe una única prop, `onExport: (formato) => Promise<void>`, y no conoce el reporte, el endpoint ni el servicio que lo resuelve (SOLID: un componente de UI no llama a la API). Maneja su propio estado de carga (deshabilita el trigger mientras exporta, sin agregar un spinner — coherente con el resto del proyecto, donde ninguna acción disparada desde un item de `Dropdown` muestra un indicador de carga individual, ej. `RowActions` en Pedidos) y su propio manejo de error (`infoAlert`, mismo patrón que `showApiError` ya usado en las 3 páginas de reportes) y de éxito (`showSuccessToast`, mismo patrón que el resto de acciones mutables del proyecto).

### Utilidades nuevas

- **`src/utils/download-file.ts`**: `downloadBlob(blob, filename)` (crea un `<a>` temporal con `URL.createObjectURL`, dispara el click, libera el object URL) y `filenameFromContentDisposition(header, fallback)` (extrae el nombre de archivo del header `Content-Disposition` que arma el backend — el frontend nunca inventa su propio nombre de archivo).
- **`src/types/export.ts`**: `FormatoExportacion` (igual al tipo homónimo del backend), `FORMATOS_EXPORTACION_OPTIONS` (las 5 opciones del Dropdown) y `ArchivoDescargable` (`{ blob, filename }`, lo que un servicio de exportación devuelve).
- **`src/types/reporte.ts`** — se agregan `Reporte{Pedidos,Entregas,Motorizados}ExportParams` (`Omit<...Params, 'page' | 'limit'> & { formato, generadoPor }`), espejo exacto de los DTOs de exportación del backend.

### `ReportesService` — 3 métodos nuevos

`exportarReportePedidos`/`exportarReporteEntregas`/`exportarReporteMotorizados`: cada uno llama a su endpoint `/export` con `responseType: 'blob'` y devuelve `{ blob, filename }` (nunca dispara la descarga — "servicios nunca manipulan el DOM", regla de arquitectura ya existente). El nombre de archivo se lee siempre de `Content-Disposition` vía `filenameFromContentDisposition`.

### Páginas modificadas

`reporte-pedidos.page.ts`, `reporte-entregas.page.ts`, `reporte-motorizados.page.ts`: cada una construye un único `ExportButton` (una sola vez, no en cada re-render) y lo pasa al slot `actions` de `PageHeader` (ya existía, usado antes solo por Usuarios). El callback `onExport` de cada página arma los mismos parámetros de filtro que ya usa esa página para `fetchPage`/`fetchAllPages` (mismo objeto `currentParams` capturado por clausura — ningún filtro nuevo, ninguna lógica de filtro duplicada) más `formato` y `generadoPor` (`SessionService.getCurrentUser()` + `nombreCompleto`, mismo patrón de campo de auditoría ya establecido desde la Fase 7), llama al servicio, y descarga el resultado con `downloadBlob`.

### Corrección necesaria en infraestructura compartida (no de negocio)

- **`src/services/http/http-client.ts`**: el interceptor de errores asumía que `error.response.data` siempre era el JSON ya parseado del backend. Con `responseType: 'blob'` (introducido por primera vez en esta fase), una respuesta de error (ej. `400` por `formato` inválido) llega como `Blob`, no como objeto — sin corrección, el mensaje real del backend se perdía y solo quedaba el mensaje genérico de axios. Se agregó `resolveErrorBody()`, que detecta `data instanceof Blob` y lo parsea (`await blob.text()` + `JSON.parse`) antes de normalizar el `HttpError`. No cambia el comportamiento para ninguna solicitud JSON existente (el `Blob` nunca ocurre en ese caso).
- **Backend — `main.ts`**: se agregó `exposedHeaders: ['Content-Disposition']` a `app.enableCors(...)` — sin esto, el navegador oculta ese header a JavaScript aunque viaje en la respuesta, y `filenameFromContentDisposition` no tendría nada que leer. Cambio de una línea, documentado también en `Backend/ARCHITECTURE.md` §7 y `Backend/DEVELOPMENT_PROGRESS.md` Fase 16.

Ambos son correcciones de infraestructura estrictamente necesarias para que la funcionalidad pedida en esta fase funcione en un navegador real — no son cambios de arquitectura ni de reglas de negocio.

### Componentes reutilizados (sin crear ninguno nuevo salvo `ExportButton`)

`Button`, `Dropdown`, `PageHeader` (slot `actions`), `infoAlert`, `showSuccessToast`, `SessionService`, `nombreCompleto`.

### Responsive y Dark Mode

Verificado por lectura de código: `ExportButton` no introduce ninguna clase nueva de color/tamaño — es exactamente `Button` (`variant: 'outline'`, ya verificado en ambos temas desde la Fase 2) dentro de `Dropdown` (Portal a `document.body`, posicionamiento y foco ya verificados en las Fases 15/18-bugfix). El slot `actions` de `PageHeader` ya es responsive (`flex-wrap` en el contenedor, Fase 2/13) — un botón adicional simplemente se ajusta como cualquier otro `actions` existente (ej. "Nuevo usuario" en Usuarios).

### Pruebas realizadas

- Backend: `prisma validate`, `prisma generate`, `tsc --noEmit`, `npm run build`, `eslint`, `prettier`, `npm test` (unit), `npm run test:e2e` — sin errores. 15 combinaciones (3 reportes × 5 formatos) probadas contra el backend real corriendo en modo watch: `200`, `Content-Type`/`Content-Disposition` correctos, contenido verificado (JSON/XML reflejan filtros y total; CSV con BOM UTF-8 válido; XLSX releído con `exceljs` confirma estructura; PDF con magic bytes válidos; XML validado como bien formado). Casos de error (`formato` inválido, `generadoPor` faltante, `estado` inválido en Entregas) → `400` con mensaje correcto.
- Frontend: `npx tsc --noEmit`, `npx eslint "src/**/*.ts"`, `npx prettier --check` (1 archivo reformateado sin cambio funcional), `npm run build` — los cuatro sin errores. Servidor de desarrollo (Vite) verificado activo y sirviendo la SPA sin errores de compilación tras los cambios.
- Lógica de `filenameFromContentDisposition` verificada de forma aislada (Node) contra un header real devuelto por el backend.

**Limitación de esta verificación**: no hay herramienta de automatización de navegador en este entorno — la apertura real del Dropdown "Exportar", el click en cada formato, y la descarga efectiva del archivo en un navegador no se ejecutaron de forma interactiva por mí; la verificación se hizo por lectura exhaustiva del código (mismos componentes/patrones ya verificados visualmente en fases anteriores) y por pruebas funcionales directas contra el backend real (curl) que confirman que cada respuesta es exactamente lo que el navegador necesita para completar la descarga (headers correctos, contenido correcto).

### URL local del servidor

- Frontend: **http://localhost:5173**.
- Backend: **http://localhost:3000/api/v1**.

### Problemas encontrados

Ninguno bloqueante. Las dos correcciones de infraestructura (interceptor de errores para blobs, CORS `exposedHeaders`) se identificaron y resolvieron durante esta misma fase, antes de que afectaran a ningún usuario real.
