# API Overview — HAKU Courier Backend

Todas las rutas están bajo el prefijo `/api/v1` (`API_PREFIX`/`API_VERSION` configurables). Documentación interactiva completa en `/api/docs` (Swagger).

## Flujo general del sistema

1. Se da de alta una **Tienda** y sus **Sucursales**.
2. Se registran **Usuarios** (`nombres`, `apellidos`, `usuario`, `correo`, `password`, rol `administrador` o `motorizado` — `nombres`/`apellidos` obligatorios desde la Fase 16); un usuario con rol `motorizado` puede tener un **Perfil de Motorizado** (placa, estado operativo).
3. Se registra un **Cliente** (destinatario de las entregas).
4. Se crea un **Pedido** (CU01) asociado a una sucursal y un cliente, en estado `pendiente`, sin motorizado asignado.
5. Un administrador **asigna un motorizado** (CU05) → `asignado`.
6. El motorizado **confirma el recojo** (CU08, con foto) → `recogido`, **inicia la ruta** (CU09) → `en_ruta`, y **confirma la entrega** (CU10, con fotos) → `entregado`.
7. En cualquier punto antes de la entrega, el pedido puede **cancelarse** (CU04), **reasignarse** a otro motorizado (CU06), o el motorizado puede registrar **cliente ausente** (CU11) o **rechazo** (CU12) una vez en ruta.
8. Cualquier motorizado puede **reportar un incidente** (CU13) asociado o no a un pedido puntual.
9. Cada cambio de estado y cada reasignación quedan registrados automáticamente en el **Historial del Pedido** (CU16, solo lectura) y cada foto en **Fotos de Entrega** (CU17, solo lectura) — ningún endpoint los escribe directamente, solo se generan como efecto de los casos de uso anteriores.
10. Los **Reportes** (CU18–CU20) consultan el estado acumulado del sistema: pedidos filtrados, entregas por estado final, y métricas por motorizado.

No existe autenticación por token (JWT) ni autorización por roles todavía: todo endpoint que necesita saber "quién" realiza una acción lo recibe explícito en el body (`usuarioId`, `motorizadoId`, `creadoPorId`).

## Módulos y casos de uso cubiertos

| Módulo                  | Casos de uso                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Usuarios                | Gestión de cuentas (crear, listar, editar, activar/desactivar, eliminar lógicamente) |
| Auth                    | Autorregistro (rol motorizado) y login (usuario/correo + contraseña)                 |
| Tiendas                 | CU14 — Gestionar Tiendas                                                             |
| Sucursales              | Gestión de sucursales por tienda                                                     |
| Clientes                | Gestión de destinatarios                                                             |
| Perfiles de Motorizados | CU15 — Gestionar Motorizados                                                         |
| Pedidos                 | CU01 (Registrar), CU02 (Consultar), CU03 (Editar)                                    |
| Flujo de Pedido         | CU04, CU05, CU06, CU08, CU09, CU10, CU11, CU12                                       |
| Historial de Pedidos    | CU16 — Consultar Historial (solo lectura)                                            |
| Fotos de Entrega        | CU17 — Consultar Fotografías (solo lectura)                                          |
| Incidentes              | CU13 — Reportar Incidente (crear/consultar/listar, sin editar/eliminar)              |
| Reportes                | CU18, CU19, CU20 (solo lectura)                                                      |
| Importaciones           | Fase 19 — Importación masiva de Clientes, Tiendas y Motorizados                      |
| Pagos                   | Fase 20 — Registro de pagos por pedido (parciales y/o mixtos)                        |

CU07 (Ver Pedidos Asignados) no tiene un filtro directo por motorizado en el listado de Pedidos; el mismo resultado se obtiene hoy vía `GET /reportes/pedidos?motorizadoId=`.

## Endpoints por módulo

### Health

| Método | Ruta | Descripción                              |
| ------ | ---- | ---------------------------------------- |
| GET    | `/`  | Verificación de que la API está en línea |

### Usuarios

| Método | Ruta                       | Descripción                                   |
| ------ | -------------------------- | --------------------------------------------- |
| POST   | `/usuarios`                | Crear usuario                                 |
| GET    | `/usuarios`                | Listar (paginado, filtros por usuario/correo) |
| GET    | `/usuarios/:id`            | Buscar por id                                 |
| PATCH  | `/usuarios/:id`            | Actualizar                                    |
| PATCH  | `/usuarios/:id/activar`    | Activar cuenta                                |
| PATCH  | `/usuarios/:id/desactivar` | Desactivar cuenta                             |
| DELETE | `/usuarios/:id`            | Eliminar lógicamente                          |

### Auth

| Método | Ruta             | Descripción                                                                                                                                                         |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/register` | Autorregistro público (siempre rol `motorizado`; requiere `nombres`/`apellidos` desde la Fase 16, igual que `POST /usuarios`)                                       |
| POST   | `/auth/login`    | Login con usuario o correo + contraseña (sin cambios en el flujo) — la respuesta (`{ usuario: UsuarioResponseDto }`) incluye `nombres`/`apellidos` desde la Fase 16 |

### Tiendas

| Método | Ruta                      | Descripción                            |
| ------ | ------------------------- | -------------------------------------- |
| POST   | `/tiendas`                | Crear tienda                           |
| GET    | `/tiendas`                | Listar (paginado, búsqueda por nombre) |
| GET    | `/tiendas/:id`            | Buscar por id                          |
| PATCH  | `/tiendas/:id`            | Actualizar                             |
| PATCH  | `/tiendas/:id/activar`    | Activar                                |
| PATCH  | `/tiendas/:id/desactivar` | Desactivar                             |
| DELETE | `/tiendas/:id`            | Eliminar lógicamente                   |

### Sucursales

| Método | Ruta              | Descripción                                               |
| ------ | ----------------- | --------------------------------------------------------- |
| POST   | `/sucursales`     | Crear sucursal para una tienda existente                  |
| GET    | `/sucursales`     | Listar (paginado, filtro por tienda, búsqueda por nombre) |
| GET    | `/sucursales/:id` | Buscar por id                                             |
| PATCH  | `/sucursales/:id` | Actualizar                                                |
| DELETE | `/sucursales/:id` | Eliminar lógicamente                                      |

### Clientes

| Método | Ruta            | Descripción                                               |
| ------ | --------------- | --------------------------------------------------------- |
| POST   | `/clientes`     | Crear cliente                                             |
| GET    | `/clientes`     | Listar (paginado, búsqueda por nombre/teléfono/documento) |
| GET    | `/clientes/:id` | Buscar por id                                             |
| PATCH  | `/clientes/:id` | Actualizar                                                |
| DELETE | `/clientes/:id` | Eliminar lógicamente                                      |

### Perfiles de Motorizados

| Método | Ruta                        | Descripción                                         |
| ------ | --------------------------- | --------------------------------------------------- |
| POST   | `/perfiles-motorizados`     | Crear perfil para un usuario con rol motorizado     |
| GET    | `/perfiles-motorizados`     | Listar (paginado, filtros por usuario/estado/placa) |
| GET    | `/perfiles-motorizados/:id` | Buscar por id                                       |
| PATCH  | `/perfiles-motorizados/:id` | Actualizar placa/estado                             |
| DELETE | `/perfiles-motorizados/:id` | Eliminar (física)                                   |

Desde la Fase 17, toda respuesta de este módulo (`PerfilMotorizadoResponseDto`) incluye también `nombres`/`apellidos` del `Usuario` asociado (join vía Prisma `include`, un solo query — nunca N+1), estructurados como campos propios, nunca concatenados por el backend. Objetivo: que ningún consumidor de la API tenga que identificar a un motorizado únicamente por su placa.

### Pedidos

| Método | Ruta           | Descripción                                                               |
| ------ | -------------- | ------------------------------------------------------------------------- |
| POST   | `/pedidos`     | Registrar pedido (CU01, estado inicial `pendiente`)                       |
| GET    | `/pedidos`     | Listar (CU02, paginado, filtros por código/cliente/sucursal/estado/fecha) |
| GET    | `/pedidos/:id` | Buscar por id (CU02)                                                      |
| PATCH  | `/pedidos/:id` | Editar datos (CU03; no cambia estado ni motorizado)                       |
| DELETE | `/pedidos/:id` | Eliminar (física, solo si no tiene registros asociados)                   |

### Flujo de Pedido

| Método | Ruta                                | Caso de uso                          |
| ------ | ----------------------------------- | ------------------------------------ |
| POST   | `/pedidos/:id/asignar-motorizado`   | CU05 — Asignar Motorizado            |
| POST   | `/pedidos/:id/reasignar-motorizado` | CU06 — Reasignar Motorizado          |
| POST   | `/pedidos/:id/confirmar-recojo`     | CU08 — Confirmar Recojo (`multipart/form-data`, campo `foto`, Fase 22)   |
| POST   | `/pedidos/:id/iniciar-ruta`         | CU09 — Iniciar Ruta                  |
| POST   | `/pedidos/:id/confirmar-entrega`    | CU10 — Confirmar Entrega (`multipart/form-data`, campo `fotos` + `fotoPrincipalIndex` opcional, Fase 22) |
| POST   | `/pedidos/:id/cliente-ausente`      | CU11 — Registrar Cliente Ausente     |
| POST   | `/pedidos/:id/rechazo`              | CU12 — Registrar Rechazo             |
| POST   | `/pedidos/:id/cancelar`             | CU04 — Cancelar Pedido               |

### Historial de Pedidos (solo lectura)

| Método | Ruta                     | Descripción                                     |
| ------ | ------------------------ | ----------------------------------------------- |
| GET    | `/pedidos/:id/historial` | CU16 — Historial paginado de eventos del pedido |

### Fotos de Entrega (solo lectura)

Fase 22: las fotografías se almacenan directamente en MySQL (`FotoEntrega.imagen`, `LONGBLOB`) — ya no existen como URL ni archivo externo. El listado solo devuelve metadata (`id`/`pedidoId`/`motorizadoId`/`tipo`/`mimeType`/`esPrincipal`); el binario se sirve por separado.

| Método | Ruta                                 | Descripción                                                                |
| ------ | ------------------------------------ | --------------------------------------------------------------------------- |
| GET    | `/pedidos/:id/fotos`                 | CU17 — Fotos paginadas de recojo/entrega del pedido (metadata, sin binario) |
| GET    | `/pedidos/:id/fotos/:fotoId/imagen`  | Fase 22 — Sirve el binario de una foto (`Content-Type` según `mimeType`, siempre `image/webp`), leído directamente desde MySQL |

### Incidentes (CRUD parcial)

| Método | Ruta              | Descripción                                                    |
| ------ | ----------------- | -------------------------------------------------------------- |
| POST   | `/incidentes`     | CU13 — Reportar incidente                                      |
| GET    | `/incidentes`     | Listar (paginado, filtros por pedido/motorizado/tipo/resuelto) |
| GET    | `/incidentes/:id` | Buscar por id                                                  |

### Reportes (solo lectura)

| Método | Ruta                       | Caso de uso                                                                    |
| ------ | -------------------------- | ------------------------------------------------------------------------------- |
| GET    | `/reportes/pedidos`        | CU18 — filtros combinables: fecha, tienda, estado, motorizado                  |
| GET    | `/reportes/entregas`       | CU19 — pedidos entregados/cancelados/devueltos/reprogramados, filtro de fecha  |
| GET    | `/reportes/motorizados`    | CU20 — pedidos atendidos, entregas, incidentes, productividad por motorizado   |
| GET    | `/reportes/pedidos/export`     | Fase 18 — exporta CU18 (mismos filtros + `page`/`limit`) a `xlsx`/`pdf`/`csv`/`json`/`xml` |
| GET    | `/reportes/entregas/export`    | Fase 18 — exporta CU19 (mismos filtros) a los mismos 5 formatos                |
| GET    | `/reportes/motorizados/export` | Fase 18 — exporta CU20 (mismos filtros) a los mismos 5 formatos                |

Desde la Fase 17, `GET /reportes/motorizados` (`ReporteMotorizadoItemDto`) también incluye `nombres`/`apellidos` del usuario asociado a cada motorizado, junto a su `placa`. `GET /reportes/pedidos` y `GET /reportes/entregas` no cambiaron (siguen exponiendo únicamente `motorizadoActualId`): el frontend ya resuelve la representación completa del motorizado cruzando ese id contra `GET /perfiles-motorizados`, que desde esta misma fase ya trae `nombres`/`apellidos`.

### Exportación de reportes (Fase 18)

Cada endpoint `/reportes/{pedidos,entregas,motorizados}/export` acepta exactamente los mismos filtros que su reporte visual homónimo (sin `page`/`limit`: la exportación siempre trae todas las filas que coincidan), más dos parámetros propios:

- `formato` (obligatorio): `xlsx` | `pdf` | `csv` | `json` | `xml`.
- `generadoPor` (obligatorio, string, máx. 150 caracteres): nombre de quien genera el archivo — no hay JWT, se recibe explícito del cliente (mismo patrón que `creadoPorId`/`usuarioId` en otros módulos).

La respuesta es el archivo binario (`Content-Type` según el formato, `Content-Disposition: attachment; filename="..."` con un nombre generado a partir del título del reporte y la fecha/hora de generación). Los 5 formatos contienen siempre la misma información: nombre del reporte, fecha de generación, usuario que lo generó, filtros aplicados, total de registros y los datos — nunca solo la tabla cruda. Ver `documentacion/backend/ARCHITECTURE.md` (§7) para la arquitectura de exportación.

### Centro de Importaciones (Fase 19)

Único punto de entrada para importación masiva de Clientes, Tiendas y Motorizados, en Excel (.xlsx), JSON o XML.

| Método | Ruta                                          | Descripción                                                                 |
| ------ | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/importaciones/:entidad/plantilla`            | Descarga la plantilla oficial (`?formato=xlsx\|json\|xml`)                   |
| POST   | `/importaciones/:entidad/analizar`             | Vista previa: valida y detecta duplicados sin escribir nada (`?formato=`)   |
| POST   | `/importaciones/:entidad/confirmar`            | Importación real, transaccional por fila (`?formato=&usuarioId=`)           |
| GET    | `/importaciones/historial`                     | Historial paginado (`?entidad=` opcional)                                    |
| GET    | `/importaciones/historial/:id`                 | Detalle de una importación (incluye las filas duplicadas/inválidas)          |
| GET    | `/importaciones/historial/:id/reporte-errores` | Descarga (o redescarga) el reporte de errores en Excel                       |

`:entidad` es uno de `cliente`, `tienda`, `motorizado`. `analizar`/`confirmar` reciben el archivo como `multipart/form-data` (campo `archivo`); `confirmar` además exige `usuarioId` (quién confirma — no hay JWT, se recibe explícito, igual que `generadoPor` en exportación). Duplicados: Clientes por `documentoIdentidad`, Tiendas por `nombre`/`ruc`, Motorizados por `usuario` (ya con perfil) o `placa` — todas reglas ya implementadas en el CRUD de cada entidad, reutilizadas tal cual (ver `documentacion/backend/ARCHITECTURE.md` §8 y `DEVELOPMENT_PROGRESS.md` Fase 17 para el detalle, incluida la ambigüedad resuelta con el cliente sobre `documentoIdentidad`/`placa`). La importación de Motorizados nunca crea una cuenta de Usuario: `usuario` debe ser el login de una cuenta ya existente, con rol motorizado y activa.

### Pagos (Fase 20)

Registro de pagos de un pedido — parciales y/o mixtos, cualquier combinación de métodos. Un pago es un registro histórico inmutable: no existe edición ni eliminación.

| Método | Ruta                        | Descripción                                                                    |
| ------ | --------------------------- | ------------------------------------------------------------------------------- |
| POST   | `/pedidos/:id/pagos`        | Registra un pago                                                               |
| GET    | `/pedidos/:id/pagos`        | Lista los pagos del pedido (paginado)                                          |
| GET    | `/pedidos/:id/pagos/resumen`| Resumen calculado: total del pedido, total pagado, saldo pendiente, estado     |

`metodoPago` es uno de `efectivo`, `yape`, `plin`, `transferencia`, `tarjeta` (enum, no admite strings libres). Para `efectivo`, `montoRecibido` es obligatorio (`400` si es menor al `monto`) y el backend calcula `vuelto` automáticamente; para el resto de métodos, `montoRecibido` ni se solicita ni se acepta. `creadoPorId` (quién registra — no hay JWT, se recibe explícito). El resumen (`totalPedido`, `totalPagado`, `saldoPendiente`, `estadoPago`) nunca se almacena: se calcula en cada solicitud a partir de los pagos registrados (`totalPedido = valorProducto + costoEnvio` del pedido; `estadoPago = "pagado"` cuando `totalPagado >= totalPedido`). Ver `documentacion/backend/ARCHITECTURE.md` §9 y `DEVELOPMENT_PROGRESS.md` Fase 18 para el detalle completo.

## Máquina de estados de `Pedido`

```
pendiente ──asignar──> asignado ──confirmar-recojo──> recogido ──iniciar-ruta──> en_ruta ──confirmar-entrega──> entregado
    │                      │                              │                         │
    │                      │                              │                         ├──cliente-ausente──> cliente_ausente
    │                      │                              │                         └──rechazo──────────> rechazado
    │                      └──reasignar-motorizado (mismo estado, cambia motorizado_actual_id)
    │
    └──cancelar (desde pendiente/asignado/recogido/en_ruta)──> cancelado
```

`devuelto` y `reprogramado` existen como valores válidos de `EstadoPedido` (reportables en CU19) pero ningún caso de uso implementado los produce todavía — están reservados para casos de uso futuros no definidos en la documentación funcional actual.

## Errores estándar

Todas las respuestas de error siguen el mismo formato (`HttpExceptionFilter`):

```json
{
  "statusCode": 404,
  "timestamp": "2026-07-13T...",
  "path": "/api/v1/...",
  "method": "GET",
  "message": "..."
}
```

- `400` — DTO inválido, `:id` no numérico, o regla de negocio puntual (ej. estado no válido para Reporte de Entregas)
- `401` — credenciales inválidas (solo en `/auth/login`)
- `404` — entidad no encontrada o eliminada lógicamente
- `409` — conflicto de unicidad o de estado (transición no permitida)
