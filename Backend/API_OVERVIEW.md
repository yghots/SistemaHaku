# API Overview — HAKU Courier Backend

Todas las rutas están bajo el prefijo `/api/v1` (`API_PREFIX`/`API_VERSION` configurables). Documentación interactiva completa en `/api/docs` (Swagger).

## Flujo general del sistema

1. Se da de alta una **Tienda** y sus **Sucursales**.
2. Se registran **Usuarios** (rol `administrador` o `motorizado`); un usuario con rol `motorizado` puede tener un **Perfil de Motorizado** (placa, estado operativo).
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

| Módulo | Casos de uso |
|---|---|
| Usuarios | Gestión de cuentas (crear, listar, editar, activar/desactivar, eliminar lógicamente) |
| Auth | Autorregistro (rol motorizado) y login (usuario/correo + contraseña) |
| Tiendas | CU14 — Gestionar Tiendas |
| Sucursales | Gestión de sucursales por tienda |
| Clientes | Gestión de destinatarios |
| Perfiles de Motorizados | CU15 — Gestionar Motorizados |
| Pedidos | CU01 (Registrar), CU02 (Consultar), CU03 (Editar) |
| Flujo de Pedido | CU04, CU05, CU06, CU08, CU09, CU10, CU11, CU12 |
| Historial de Pedidos | CU16 — Consultar Historial (solo lectura) |
| Fotos de Entrega | CU17 — Consultar Fotografías (solo lectura) |
| Incidentes | CU13 — Reportar Incidente (crear/consultar/listar, sin editar/eliminar) |
| Reportes | CU18, CU19, CU20 (solo lectura) |

CU07 (Ver Pedidos Asignados) no tiene un filtro directo por motorizado en el listado de Pedidos; el mismo resultado se obtiene hoy vía `GET /reportes/pedidos?motorizadoId=`.

## Endpoints por módulo

### Health
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Verificación de que la API está en línea |

### Usuarios
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/usuarios` | Crear usuario |
| GET | `/usuarios` | Listar (paginado, filtros por usuario/correo) |
| GET | `/usuarios/:id` | Buscar por id |
| PATCH | `/usuarios/:id` | Actualizar |
| PATCH | `/usuarios/:id/activar` | Activar cuenta |
| PATCH | `/usuarios/:id/desactivar` | Desactivar cuenta |
| DELETE | `/usuarios/:id` | Eliminar lógicamente |

### Auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Autorregistro público (siempre rol `motorizado`) |
| POST | `/auth/login` | Login con usuario o correo + contraseña |

### Tiendas
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/tiendas` | Crear tienda |
| GET | `/tiendas` | Listar (paginado, búsqueda por nombre) |
| GET | `/tiendas/:id` | Buscar por id |
| PATCH | `/tiendas/:id` | Actualizar |
| PATCH | `/tiendas/:id/activar` | Activar |
| PATCH | `/tiendas/:id/desactivar` | Desactivar |
| DELETE | `/tiendas/:id` | Eliminar lógicamente |

### Sucursales
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/sucursales` | Crear sucursal para una tienda existente |
| GET | `/sucursales` | Listar (paginado, filtro por tienda, búsqueda por nombre) |
| GET | `/sucursales/:id` | Buscar por id |
| PATCH | `/sucursales/:id` | Actualizar |
| DELETE | `/sucursales/:id` | Eliminar lógicamente |

### Clientes
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/clientes` | Crear cliente |
| GET | `/clientes` | Listar (paginado, búsqueda por nombre/teléfono/documento) |
| GET | `/clientes/:id` | Buscar por id |
| PATCH | `/clientes/:id` | Actualizar |
| DELETE | `/clientes/:id` | Eliminar lógicamente |

### Perfiles de Motorizados
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/perfiles-motorizados` | Crear perfil para un usuario con rol motorizado |
| GET | `/perfiles-motorizados` | Listar (paginado, filtros por usuario/estado/placa) |
| GET | `/perfiles-motorizados/:id` | Buscar por id |
| PATCH | `/perfiles-motorizados/:id` | Actualizar placa/estado |
| DELETE | `/perfiles-motorizados/:id` | Eliminar (física) |

### Pedidos
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/pedidos` | Registrar pedido (CU01, estado inicial `pendiente`) |
| GET | `/pedidos` | Listar (CU02, paginado, filtros por código/cliente/sucursal/estado/fecha) |
| GET | `/pedidos/:id` | Buscar por id (CU02) |
| PATCH | `/pedidos/:id` | Editar datos (CU03; no cambia estado ni motorizado) |
| DELETE | `/pedidos/:id` | Eliminar (física, solo si no tiene registros asociados) |

### Flujo de Pedido
| Método | Ruta | Caso de uso |
|---|---|---|
| POST | `/pedidos/:id/asignar-motorizado` | CU05 — Asignar Motorizado |
| POST | `/pedidos/:id/reasignar-motorizado` | CU06 — Reasignar Motorizado |
| POST | `/pedidos/:id/confirmar-recojo` | CU08 — Confirmar Recojo (con foto) |
| POST | `/pedidos/:id/iniciar-ruta` | CU09 — Iniciar Ruta |
| POST | `/pedidos/:id/confirmar-entrega` | CU10 — Confirmar Entrega (con fotos) |
| POST | `/pedidos/:id/cliente-ausente` | CU11 — Registrar Cliente Ausente |
| POST | `/pedidos/:id/rechazo` | CU12 — Registrar Rechazo |
| POST | `/pedidos/:id/cancelar` | CU04 — Cancelar Pedido |

### Historial de Pedidos (solo lectura)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/pedidos/:id/historial` | CU16 — Historial paginado de eventos del pedido |

### Fotos de Entrega (solo lectura)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/pedidos/:id/fotos` | CU17 — Fotos paginadas de recojo/entrega del pedido |

### Incidentes (CRUD parcial)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/incidentes` | CU13 — Reportar incidente |
| GET | `/incidentes` | Listar (paginado, filtros por pedido/motorizado/tipo/resuelto) |
| GET | `/incidentes/:id` | Buscar por id |

### Reportes (solo lectura)
| Método | Ruta | Caso de uso |
|---|---|---|
| GET | `/reportes/pedidos` | CU18 — filtros combinables: fecha, tienda, estado, motorizado |
| GET | `/reportes/entregas` | CU19 — pedidos entregados/cancelados/devueltos/reprogramados, filtro de fecha |
| GET | `/reportes/motorizados` | CU20 — pedidos atendidos, entregas, incidentes, productividad por motorizado |

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
{ "statusCode": 404, "timestamp": "2026-07-13T...", "path": "/api/v1/...", "method": "GET", "message": "..." }
```

- `400` — DTO inválido, `:id` no numérico, o regla de negocio puntual (ej. estado no válido para Reporte de Entregas)
- `401` — credenciales inválidas (solo en `/auth/login`)
- `404` — entidad no encontrada o eliminada lógicamente
- `409` — conflicto de unicidad o de estado (transición no permitida)
