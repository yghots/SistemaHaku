# TECH_DEBT.md — Backlog de Mejoras Futuras HAKU Courier

**Fecha:** 2026-07-14 (actualizado en la Fase 15 — Corrección de Hallazgos Críticos)
**Naturaleza de este documento:** únicamente mejoras futuras (backlog prescriptivo, orientado a iniciativas). Los hallazgos técnicos/diagnóstico viven en `AUDIT_REPORT.md` — no se mezclan aquí. Ningún ítem de aquí implica que algo esté "mal" hoy; son inversiones a considerar para el futuro del proyecto, con o sin relación a un hallazgo puntual de la auditoría.
**Nada de esto se implementa sin autorización explícita.**

---

## 1. Seguridad y autenticación

> **Trade-off documentado (proyecto Fase 15):** la ausencia de JWT/guards/roles es una decisión consciente y ya aceptada del proyecto desde su inicio (`ARCHITECTURE.md` §1/6), **no un bug** — el antiguo hallazgo "C3" de `AUDIT_REPORT.md` fue revisado en la Fase 15 y reclasificado formalmente a esta categoría (ver ese documento). Sigue siendo, sin embargo, un **requisito obligatorio antes de cualquier despliegue con datos/usuarios reales** — no una mejora opcional de este backlog. El ítem de abajo no cambió de contenido, solo de encuadre: es la implementación futura de una decisión de alcance ya tomada, no la corrección de un defecto.

- **Implementar autenticación real (JWT + guards + roles).** El frontend ya está preparado para esto sin tocar páginas/componentes (`SessionService`/`auth-token.ts` documentados como el único punto de cambio, `CLAUDE.md` §11). Es la iniciativa de mayor esfuerzo y mayor impacto del backlog completo — recomendable planificarla como su propio proyecto, no como una corrección puntual. **Bloqueante de producción**, no una mejora discrecional (ver recuadro arriba).
- **Rate limiting en endpoints públicos/sensibles**, empezando por `/auth/login` y `/auth/register` (`@nestjs/throttler` o equivalente).
- **Condicionar la exposición de Swagger** (`/api/docs`) al entorno (deshabilitado o protegido en producción).
- **Revisar sistemáticamente qué campos "quién hizo esto" (`creadoPorId`, `usuarioId`, `motorizadoId`) deberían validarse contra `activo`/`rol` del usuario referenciado**, más allá de los puntos ya identificados — candidato natural a resolverse en el mismo trabajo que introduzca JWT (en ese momento estos campos dejan de recibirse del cliente y se derivan de la sesión).
- ~~Definir explícitamente una política de manejo de errores no controlados que documente qué información puede y no puede llegar al cliente~~ — **resuelto en la Fase 15** (`HttpExceptionFilter` corregido, hallazgo C2 de `AUDIT_REPORT.md`; política ahora documentada en `ARCHITECTURE.md` §7). Queda como mejora futura menor: agregar una prueba automatizada (unitaria) que la verifique de forma repetible en vez de solo por revisión manual de código.

## 2. Concurrencia y confiabilidad del dominio

- ~~Introducir control de concurrencia optimista o bloqueo de fila en las transiciones de `flujo-pedido`~~ — **resuelto en la Fase 15** (hallazgo C1 de `AUDIT_REPORT.md`; patrón `actualizarPedidoCondicional` documentado como permanente en `ARCHITECTURE.md` §5/6). Queda como mejora futura: evaluar si el mismo patrón de "validar antes de transaccionar sin condición atómica en el `update`" existe en algún otro módulo con escrituras condicionadas a un estado previo fuera de `flujo-pedido`, y aplicar el mismo patrón ahí si corresponde.
- **Definir formalmente la relación entre `PerfilMotorizado.estado` y el flujo operativo** (¿debe bloquear asignación? ¿quién lo transiciona y cuándo?) — hoy es un campo que existe en el modelo sin ningún consumidor real en la lógica de negocio.
- **Decidir con el negocio el comportamiento deseado de `reasignarMotorizado`** (¿debería exigir el mismo estado que las demás transiciones?) y resolver la divergencia entre el diagrama público de `API_OVERVIEW.md` y el comportamiento real documentado en `DEVELOPMENT_PROGRESS.md`.

## 3. Cobertura de pruebas automatizadas

- **Adoptar una suite de pruebas unitarias real para el Backend** (Jest ya está instalado y configurado — solo falta escribir specs más allá del boilerplate), priorizando `flujo-pedido` (el módulo de mayor riesgo) y los servicios con reglas de unicidad/validación.
- **Pruebas e2e reales** sobre los flujos críticos (ciclo de vida completo de un pedido) para reemplazar progresivamente la regresión manual documentada por fase.
- **Evaluar una herramienta de testing para el Frontend** (Vitest es la elección natural dado que ya usa Vite) — al menos para `utils/` puros (`cn`, `fetch-all-pages`, `floating-position`, `dependent-options`) donde el retorno de inversión de una prueba unitaria es más alto y el costo de escribirla es bajo.
- **Integrar estas suites a un pipeline de CI** que corra `build`/`tsc`/`eslint`/`prettier`/tests en cada cambio, en vez de depender de que cada fase las ejecute manualmente (ya se hace consistentemente, pero sin automatización que lo garantice hacia adelante).

## 4. Accesibilidad

- **Auditoría de accesibilidad dedicada con herramienta automatizada** (axe-core o similar) sobre las páginas reales, complementaria a esta revisión de código — algunos problemas (orden de foco real, comportamiento de lectores de pantalla) se verifican mejor en runtime que por lectura de código. Recomendable ahora que la corrección de foco de la Fase 15 está en su lugar, para confirmar en un navegador real lo que aquí se verificó por lectura de código.
- ~~Gestión de foco genérica reutilizable (trampa de foco + restauración) para `Modal` y `Dropdown`~~ — **resuelto en la Fase 15** (hallazgo C4 de `AUDIT_REPORT.md`; `src/utils/focus-trap.ts`, documentado como regla permanente en `CLAUDE.md` §21). Queda como mejora futura relacionada: extender `Dropdown` con roles `menuitem`/navegación por flechas (ver ítem de roles ARIA más abajo), que quedó explícitamente fuera del alcance de la Fase 15.
- **Revisión de la paleta de contraste completa** (no solo los dos tokens ya identificados) contra los umbrales WCAG AA, en ambos temas.
- **Roles ARIA completos para el patrón de menú** (`menuitem`, navegación por flechas, `aria-expanded`/`aria-haspopup` en los disparadores) — hoy vive únicamente en `Dropdown`, así que el trabajo se concentra en un solo archivo.
- **Anuncios accesibles para errores de formulario** (`FieldChrome`) — mismo argumento de apalancamiento: una utilidad, usada por todos los formularios del proyecto.

## 5. Performance

- **Migrar `mis-pedidos.page.ts`/`historial.page.ts` (panel Motorizado) al mismo patrón que el Dashboard del Motorizado**, usando `ReportesService.reportePedidos({motorizadoId})` en vez de `fetchAllPages` sin filtro sobre el sistema completo — mismo cambio ya validado y en producción en otro punto del código.
- **Evaluar si `GET /pedidos` debería admitir un filtro `motorizadoActualId` real en el backend**, lo que eliminaría por completo la necesidad de `fetchAllPages` en estos dos flujos (requiere aprobación explícita del lado del Backend, que está en Feature Freeze).
- **Revisar duplicación de llamadas HTTP evitables** identificadas en la auditoría (`pedido-form.ts`, KPI redundante del Dashboard) y, más en general, establecer una convención de "la página carga, el formulario/modal recibe por props" para evitar que este patrón reaparezca en módulos futuros.
- **Optimizar `DataTable` para no construir ambas representaciones (tabla + tarjetas) cuando el volumen de filas crezca** — hoy acotado por el tamaño de página por defecto (10), pero vale la pena revisitar si algún listado futuro necesita páginas más grandes.

## 6. Limpieza de código muerto (bajo riesgo, bajo esfuerzo)

- Remover o encontrar un uso real para: `MotorizadosService.buscarPorId`, `IncidentesService.buscarPorId`, `TiendasService.buscarPorId`, `HttpError.isNetworkError`, `clearChildren`, `showErrorToast`/`showInfoToast`/`showWarningToast` (o conectarlos a un flujo de error real que hoy no los usa), tokens de tema sin uso en `index.css`.
- Confirmar si `ReportFilters` debería exponer una búsqueda de texto en algún reporte futuro, o si la rama `type: 'search'` debería simplificarse mientras no se use.

## 7. Documentación

- Actualizar `Frontend/CLAUDE.md` §6 con el catálogo real de componentes (agregar `ResourceTable`, `FormModal`, `RowActions`, `DetailList`, `ReportFilters`).
- Actualizar `Frontend/CLAUDE.md` §"Breakpoints" para reflejar el trabajo de responsive de la Fase 13 (hoy contradice a la propia sección 20 del mismo documento).
- Reescribir `Backend/README.md` con información real del proyecto (cómo levantar la base de datos, variables de entorno mínimas, comandos reales) — hoy es el boilerplate genérico de `nest new`.
- Actualizar el diagrama de estados de `API_OVERVIEW.md` para reflejar el comportamiento real y ya documentado de `reasignarMotorizado`.

## 8. Higiene de configuración (bajo riesgo)

- Revisar si `no-explicit-any: off` y los niveles `warn` en `Backend/eslint.config.mjs` deberían endurecerse a `error` ahora que se confirmó que el código actual ya los cumple igual — evita que se introduzca deuda nueva sin que el linter la marque.
- Agregar `import 'reflect-metadata'` explícito en `Backend/src/main.ts` como salvaguarda ante cambios futuros de NestJS en la carga transitoria de metadata.
- Formatear los 4 archivos boilerplate de NestJS aún sin tocar por Prettier.
- Llamar `app.enableShutdownHooks()` en `main.ts` para garantizar `$disconnect()` de Prisma en despliegues containerizados.

---

_Fin de `TECH_DEBT.md`. Ningún ítem de este documento se implementa sin autorización explícita — es un backlog para priorizar en conjunto, no una lista de tareas en curso._
