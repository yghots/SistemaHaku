# HAKU Courier — Backend — Registro de Desarrollo

## Fase 1 — Inicialización y configuración del proyecto

**Fecha:** 2026-07-12

## Objetivo del proyecto

Backend del sistema HAKU Courier: automatizar la gestión y logística de una
empresa de delivery/courier (recepción de pedidos, asignación de motorizados,
seguimiento de recojo/entrega y reportes), según lo descrito en
`Documentacion_HAKU_Courier(1).docx` y el diagrama entidad-relación provisto.

Roles del sistema: **Administrador** (único rol administrativo) y
**Motorizado**. Tienda y Cliente participan en el proceso de negocio pero no
acceden al sistema.

## Alcance de esta fase

Únicamente inicialización y configuración de infraestructura. **No** se
implementó Prisma schema de negocio, CRUD, autenticación ni entidades. Eso
corresponde a la Fase 2, pendiente de autorización.

## Arquitectura elegida

Clean Architecture sobre NestJS 11, organizada por capas + módulos verticales:

```
src/
  common/        → cross-cutting: filters, interceptors, guards, decorators,
                   middlewares, pipes, dto (base), utils
  config/        → configuration.ts (config tipada) y env.validation.ts
                   (validación de entorno con class-validator)
  modules/        → vacío, listo para los módulos de negocio (Fase 2+). Cada
                   módulo futuro (pedidos, usuarios, tiendas, etc.) contendrá
                   internamente sus propios controllers, services,
                   repositories, dto, entities e interfaces (convención
                   estándar de Nest, no carpetas planas por capa a nivel raíz)
  prisma/        → PrismaModule + PrismaService (infraestructura de acceso
                   a datos, sin modelos de negocio todavía)
  shared/        → interfaces/ y constants/ reutilizables entre módulos
  app.module.ts
  main.ts
```

Las carpetas vacías (`common/decorators`, `common/guards`,
`common/middlewares`, `common/pipes`, `common/dto`, `common/utils`,
`shared/interfaces`, `shared/constants`, `modules/`) tienen un `.gitkeep` con
una línea explicando su propósito futuro.

## Decisiones técnicas tomadas

- **NestJS 11 (última estable)** generado con `nest new --strict`, package
  manager npm.
- **Prisma 7.8.0**, generador `provider = "prisma-client-js"` **sin** `output`
  personalizado → el cliente se genera en `node_modules/@prisma/client`
  (ubicación por defecto). Se probó primero el nuevo generador
  `"prisma-client"` (ESM-first) con `output` custom, pero produce archivos
  `.ts` fuente (no un paquete pre-compilado) que rompen al recompilarlos con
  el `tsc` de Nest (mezcla `import.meta` con salida CommonJS). El generador
  clásico `prisma-client-js` evita ese problema y es totalmente compatible
  con el proyecto CommonJS de Nest.
- **Prisma 7 eliminó `url` del bloque `datasource`** del schema — ya no es
  válido `url = env("DATABASE_URL")`. La conexión ahora se pasa en runtime al
  constructor de `PrismaClient` vía un **driver adapter**. Se usó
  `@prisma/adapter-mariadb` (compatible con MySQL) inyectando la
  `DATABASE_URL` a través de `ConfigService` en `PrismaService`
  ([prisma.service.ts](src/prisma/prisma.service.ts)).
- `prisma.config.ts` (generado por `prisma init`) define la `DATABASE_URL`
  que usará la **CLI** de Prisma (`migrate`, `studio`, etc.); es independiente
  de cómo el `PrismaService` obtiene la URL en runtime.
- **`DATABASE_URL` usa `127.0.0.1` en vez de `localhost`**: con `localhost`
  se observó una demora intermitente de ~10s en la primera conexión
  (resolución DNS/networking de Docker Desktop en Windows). Con la IP literal
  la conexión es inmediata.
- **Sin alias de imports (`@common/*`, etc.)**: se evaluó, pero el compilador
  por defecto de Nest (`tsc`) no reescribe alias en el build de producción sin
  una dependencia adicional (`tsc-alias`) y coordinación extra en modo watch.
  Con la profundidad de carpetas actual no aporta suficiente valor para
  justificar esa complejidad. Se puede reconsiderar cuando existan varios
  módulos anidados y los imports relativos (`../../../`) se vuelvan
  incómodos.
- **Base de datos apuntada:** contenedor Docker `mysql` ya existente
  (`mysql:latest`, puerto 3306 expuesto), base de datos `delivery_system`
  (ya existía en el contenedor). Se usó el usuario `root` para desarrollo
  local; **antes de producción se debe crear un usuario de MySQL con
  privilegios mínimos** dedicado a la aplicación.
- `.gitignore` generado por `prisma init` sobrescribió el `.gitignore` por
  defecto de Nest (perdiendo `dist/`, `coverage/`, etc.). Se reconstruyó un
  `.gitignore` completo para proyecto Nest + Prisma.
- Corregido `start:prod` en `package.json`: el build de Nest compila con
  `rootDir` inferido en la raíz del proyecto (por convivir `prisma.config.ts`
  junto a `src/`), por lo que el entry point real queda en
  `dist/src/main.js`, no `dist/main.js`.
- Validación de entorno con `class-validator`/`class-transformer` (ya
  requeridos por el proyecto) en vez de sumar Joi como dependencia nueva.

## Inconsistencias detectadas (a resolver antes de Fase 2)

1. **La base de datos `delivery_system` ya existente en el contenedor Docker
   tiene un esquema legado** (`tablas: asignaciones, clientes, estados,
historial_estados, pedidos, repartidores, usuarios`) que **no coincide**
   con el modelo de 9 tablas del ER actual (`usuarios, tiendas, sucursales,
clientes, perfiles_motorizados, pedidos, historial_pedido,
fotos_entrega, incidentes`). Antes de correr la primera migración de
   Prisma en Fase 2 hay que decidir: recrear la base de datos desde cero,
   o migrar/descartar los datos existentes.
2. El documento funcional dice "el modelo final quedó compuesto por 8
   tablas", pero tanto el documento como el diagrama ER detallan **9**
   entidades (`USUARIOS, TIENDAS, SUCURSALES, CLIENTES,
PERFILES_MOTORIZADOS, PEDIDOS, HISTORIAL_PEDIDO, FOTOS_ENTREGA,
INCIDENTES`). Aparente error de conteo en la documentación, no afecta el
   modelo en sí.
3. El campo `password_hash` en `USUARIOS` está marcado como "NUEVO" en el
   diagrama pero no aparece descrito en el detalle de tablas del documento
   (sección 4.1). Es evidentemente necesario para el login; se asume
   correcto tal como está en el diagrama.

Ninguna de estas bloquea la Fase 1 (no se tocó el schema ni la base de
datos), pero **sí deben resolverse antes de definir el `schema.prisma` de
negocio en la Fase 2**.

## Dependencias instaladas

**Runtime:** `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`,
`@nestjs/config`, `@nestjs/swagger`, `@prisma/client`,
`@prisma/adapter-mariadb`, `class-validator`, `class-transformer`, `argon2`,
`helmet`, `compression`, `dotenv`, `reflect-metadata`, `rxjs`.

**Desarrollo:** `@nestjs/cli`, `@nestjs/schematics`, `@nestjs/testing`,
`prisma`, `@types/compression`, `@types/express`, `@types/jest`,
`@types/node`, `@types/supertest`, `eslint` (+ plugins), `prettier`, `jest`,
`ts-jest`, `ts-loader`, `ts-node`, `tsconfig-paths`, `typescript`,
`typescript-eslint`.

Nota: `npm audit` reporta 3 vulnerabilidades moderadas transitivas de
`@prisma/dev` (dependencia de desarrollo de Prisma Studio, no se usa en
runtime de la app). No se fuerza el fix porque degradaría la versión de
Prisma instalada.

## Estado actual del desarrollo

- Proyecto NestJS 11 creado y compilando sin errores (`npm run build`).
- `tsc --noEmit` sin errores de TypeScript.
- ESLint sin errores (`npm run lint`).
- Tests por defecto (unit + e2e) pasando.
- La aplicación arranca, se conecta a MySQL vía Prisma + driver adapter,
  expone `GET /api/v1` (placeholder de Nest) y Swagger en `/api/docs`
  (verificado manualmente en caliente).
- Sin schema de negocio, sin entidades, sin autenticación, sin CRUD
  (deliberadamente, según alcance de esta fase).

## Tareas pendientes (arrastradas a Fase 3)

- Diseñar los módulos de negocio dentro de `src/modules/` (pedidos,
  usuarios/auth, tiendas, sucursales, clientes, motorizados, historial,
  fotos, incidentes, reportes).
- Implementar autenticación (Argon2 ya está instalado) y autorización por
  rol (administrador / motorizado).
- Crear un usuario de MySQL de mínimo privilegio para reemplazar `root` en
  `DATABASE_URL` antes de cualquier entorno compartido.

---

## Fase 2 — Modelado de la base de datos con Prisma

**Fecha:** 2026-07-12

### Alcance de esta fase

Únicamente la capa de persistencia: `schema.prisma`, migración inicial y
Prisma Client. **No** se implementaron controllers, services, repositories,
CRUD, autenticación ni lógica de negocio.

### Decisiones tomadas por el usuario (previas a la implementación)

- La base de datos `delivery_system` existente pertenecía a una versión
  antigua del sistema → **se eliminó por completo y se recreó desde cero**
  con Prisma Migrate. No se conservó ningún dato.
- El diagrama ER provisto es la referencia oficial del modelo.
- `password_hash` (no `password`) es el nombre definitivo de la columna en
  `usuarios`, tal como aparece en el diagrama.

### Inconsistencias detectadas, presentadas al usuario y resueltas

Antes de escribir el schema se hizo una revisión cruzada ER + documentación
funcional (casos de uso). Se encontraron 4 puntos sin solución explícita en
el diseño aprobado; se presentaron con alternativas y quedaron resueltos así:

1. **`PEDIDOS` no tenía columna de fecha de creación**, pero CU18 exige
   "filtros por fecha" en los reportes → se agregó `creadoEn DateTime
@default(now())` (`creado_en`), indexado.
2. **CU10 exige registrar "observaciones" al confirmar la entrega**, pero
   ninguna de las 9 tablas tenía un campo para eso → se agregó
   `observaciones String?` a `PEDIDOS`.
3. **`SUCURSALES` no tenía `deleted_at`** (a diferencia de `TIENDAS`,
   `CLIENTES` y `USUARIOS`) → se agregó `deletedAt DateTime?` para poder
   cerrar una sucursal puntual sin romper la integridad de pedidos
   históricos.
4. **Estrategia de `onDelete` no especificada** en el ER → se definió
   `Restrict` en todas las relaciones obligatorias (el borrado real de
   usuarios/tiendas/sucursales/clientes/motorizados se hace solo vía soft
   delete) y `SetNull` únicamente en las 3 relaciones ya opcionales:
   `pedidos.motorizado_actual_id`, `historial_pedido.motorizado_id`,
   `incidentes.pedido_id`.

Notas menores aplicadas sin bloquear (ambigüedades de bajo riesgo, avisadas
en el chat):

- `PERFILES_MOTORIZADOS.estado`: el documento dice "Disponible, ocupado,
  inactivo, **etc.**" → se cerró como enum de 3 valores
  (`disponible`/`ocupado`/`inactivo`).
- `INCIDENTES.tipo`: el documento dice "Accidente, avería, daño al
  producto, **etc.**" → se cerró como enum de 4 valores
  (`accidente`/`averia`/`dano_producto`/`otro`, este último como válvula de
  escape para el "etc.").
- `descripcion_producto` en `PEDIDOS` no estaba en la lista explícita de
  campos opcionales de la sección 5 del documento, pero tampoco en la de
  obligatorios → se interpretó como opcional (coherente con "el resto queda
  disponible pero opcional").
- `usuario` (nombre de usuario de login) se marcó `@unique`, aunque el
  diagrama no lo indica explícitamente — es indispensable para poder
  autenticar en la Fase 3.

### Modelo implementado

9 tablas, generador `prisma-client-js` (heredado de la Fase 1), sin `output`
personalizado:

| Tabla                  | PK  | FKs                                                                                                  | Notas                                                                         |
| ---------------------- | --- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `usuarios`             | id  | —                                                                                                    | `usuario` y `correo` únicos; `password_hash`; enum `rol`                      |
| `tiendas`              | id  | —                                                                                                    | soft delete                                                                   |
| `sucursales`           | id  | `tienda_id` → tiendas (Restrict)                                                                     | soft delete (agregado)                                                        |
| `clientes`             | id  | —                                                                                                    | soft delete                                                                   |
| `perfiles_motorizados` | id  | `usuario_id` → usuarios (Restrict, único = 1-1)                                                      | enum `estado`                                                                 |
| `pedidos`              | id  | `sucursal_id`, `cliente_id` → Restrict; `motorizado_actual_id` → SetNull; `creado_por_id` → Restrict | `codigo_pedido` único; enum `estado`; `creado_en` y `observaciones` agregados |
| `historial_pedido`     | id  | `pedido_id`, `usuario_id` → Restrict; `motorizado_id` → SetNull                                      | `tipo_evento` discrimina uso de `estado` vs `motorizado_id`                   |
| `fotos_entrega`        | id  | `pedido_id`, `motorizado_id` → Restrict                                                              | enum `tipo` (recojo/entrega)                                                  |
| `incidentes`           | id  | `motorizado_id` → Restrict; `pedido_id` → SetNull (opcional, "si aplica")                            | enum `tipo`                                                                   |

Enums: `RolUsuario`, `EstadoMotorizado`, `EstadoPedido` (10 valores: flujo
principal + 5 alternativos), `TipoEventoHistorial`, `TipoFoto`,
`TipoIncidente`.

Índices agregados (más allá de PK/único y los de FK que Prisma crea
automáticamente en MySQL), justificados por los reportes de la
documentación (CU16, CU17, CU18, CU20):

- `pedidos(estado)`, `pedidos(creado_en)` — CU18 Reporte de Pedidos.
- `historial_pedido(pedido_id, created_at)` — CU16 Consultar Historial.
- `fotos_entrega(pedido_id, tipo)` — CU17 Consultar Fotografías.
- `incidentes(motorizado_id, resuelto)` — CU20 Reporte de Motorizados.
- `perfiles_motorizados(estado)` — para ubicar motorizados disponibles al
  asignar (CU05).

### Migración

- `prisma/migrations/20260713023718_init/migration.sql` — migración única,
  crea las 9 tablas, 13 FKs y todos los índices descritos arriba.
- Base de datos `delivery_system` eliminada y recreada vacía
  (`utf8mb4`/`utf8mb4_unicode_ci`) antes de aplicar la migración.

### Verificaciones ejecutadas — todas OK

- `prisma validate` ✓
- `prisma generate` ✓ (Prisma Client en `node_modules/@prisma/client`)
- `prisma migrate dev --name init` ✓ (migración creada y aplicada)
- `tsc --noEmit` ✓ · `npm run build` ✓ · `npm run lint` ✓
- Verificación estructural contra `information_schema` de MySQL: 9 tablas de
  negocio + `_prisma_migrations`, 13 FKs (10 `RESTRICT` + 3 `SET NULL`,
  coincide exactamente con lo aprobado), todos los índices esperados
  presentes.
- Smoke test funcional end-to-end vía Prisma Client (crear usuario admin +
  usuario motorizado con perfil 1-1, tienda con sucursal, cliente, pedido
  con todas sus relaciones, evento de historial de `cambio_estado` y de
  `reasignacion`, foto de entrega, incidente): lectura anidada completa
  correcta, `Restrict` verificado (no se pudo borrar un cliente con pedidos
  asociados), `SetNull` verificado (se pudo borrar un perfil de motorizado
  tras desvincularlo), limpieza total sin dejar residuos.

### Estado actual del desarrollo

Capa de persistencia completa y verificada. Sin controllers, services,
repositories, CRUD, autenticación ni endpoints (fuera de alcance de esta
fase, según lo solicitado).

### Tareas pendientes (arrastradas a Fase 4+)

- Diseñar los módulos de negocio restantes dentro de `src/modules/`
  (tiendas, sucursales, clientes, pedidos, historial, fotos, incidentes,
  reportes).
- Crear un usuario de MySQL de mínimo privilegio para reemplazar `root` en
  `DATABASE_URL` antes de cualquier entorno compartido.
- Definir la lógica de generación de `codigo_pedido` (autogenerado, único).
- Agregar JWT, guards y autorización por rol (explícitamente diferido, ver
  Fase 3 más abajo).

---

## Fase 3 — Usuarios y autenticación básica

**Fecha:** 2026-07-12

### Alcance de esta fase

Módulo completo de **Usuarios** (CRUD, soft delete, activar/desactivar,
paginación, búsqueda) y **Auth** básico (registro público + login), sin
JWT/guards/sesiones (diferidos a una fase posterior). No se tocó ningún otro
módulo de negocio.

### Punto de arquitectura presentado y resuelto

**Problema:** los DTOs pedidos para esta fase son `CreateUserDto`,
`UpdateUserDto`, `LoginDto`, `UserResponseDto` — ninguno adicional para
"registro". Reutilizar `CreateUserDto` tal cual en `POST /auth/register`
habría permitido que **cualquiera se autorregistrara como
`administrador`**, ya que en esta fase todavía no existen guards/JWT que
protejan nada.

**Decisión aprobada:** `POST /auth/register` fuerza `rol = 'motorizado'`
(coincide con CU15 "se autoregistran"); crear una cuenta `administrador`
solo es posible vía el CRUD de Usuarios. Se implementó con un
`RegisterDto = OmitType(CreateUsuarioDto, ['rol'])`: si alguien envía `rol`
en el body de `/auth/register`, el `ValidationPipe` global
(`forbidNonWhitelisted`) lo rechaza con 400 antes de llegar al servicio —
verificado en pruebas.

### Estructura del módulo

```
src/modules/usuarios/
  dto/
    create-usuario.dto.ts
    update-usuario.dto.ts       (PartialType de CreateUsuarioDto)
    usuario-response.dto.ts     (nunca incluye passwordHash; id como string)
    list-usuarios-query.dto.ts  (extiende PaginationQueryDto + filtros)
  interfaces/
    usuarios-repository.interface.ts  (puerto IUsuariosRepository + token DI)
  usuarios.repository.ts        (unica pieza que toca Prisma)
  usuarios.mapper.ts             (Usuario de Prisma -> UsuarioResponseDto)
  usuarios.service.ts            (reglas de negocio, hashing, duplicados)
  usuarios.controller.ts
  usuarios.module.ts

src/modules/auth/
  dto/
    login.dto.ts                (identificador: usuario o correo + password)
    register.dto.ts             (CreateUsuarioDto sin 'rol')
    auth-response.dto.ts        (envuelve UsuarioResponseDto; { usuario })
  auth.service.ts
  auth.controller.ts
  auth.module.ts                (importa UsuariosModule, reutiliza su service)

src/common/dto/
  pagination-query.dto.ts       (page/limit, reutilizable por otros modulos)
  paginated-response.dto.ts     (wrapper generico { data, total, page, limit })
```

Separación aplicada: Controller (HTTP + Swagger) → Service (reglas de
negocio, hashing, validaciones de duplicado) → Repository (Prisma, detrás de
una interfaz `IUsuariosRepository` inyectada por token — Dependency
Inversion) → Mapper (entidad Prisma → DTO de respuesta, nunca al revés). Sin
lógica de negocio en los controllers.

### Endpoints implementados

| Método | Ruta                              | Descripción                                           |
| ------ | --------------------------------- | ----------------------------------------------------- |
| POST   | `/api/v1/usuarios`                | Crear usuario (admin o motorizado)                    |
| GET    | `/api/v1/usuarios`                | Listar con paginación + filtro por `usuario`/`correo` |
| GET    | `/api/v1/usuarios/:id`            | Buscar por id                                         |
| PATCH  | `/api/v1/usuarios/:id`            | Actualizar (password solo si se envía)                |
| PATCH  | `/api/v1/usuarios/:id/activar`    | Activar cuenta                                        |
| PATCH  | `/api/v1/usuarios/:id/desactivar` | Desactivar cuenta                                     |
| DELETE | `/api/v1/usuarios/:id`            | Eliminación lógica (`deletedAt`)                      |
| POST   | `/api/v1/auth/register`           | Autorregistro público (siempre `rol=motorizado`)      |
| POST   | `/api/v1/auth/login`              | Login con `usuario` o `correo` + password             |

Todos documentados en Swagger (`/api/docs`), agrupados en los tags
`Usuarios` y `Auth`.

### Decisiones técnicas

- **Argon2** para hash de contraseñas (`argon2.hash`/`argon2.verify` con
  los parámetros por defecto del paquete, ya seguros de fábrica). Nunca se
  persiste ni se devuelve `password_hash`.
- **Activar/desactivar y eliminar lógico como endpoints propios**, no como
  campos editables en `UpdateUsuarioDto` — evita que un cliente pueda
  escribir `activo`/`deletedAt` directamente vía `PATCH` genérico.
- **Login con mensaje 401 genérico** ("Credenciales invalidas") para los 4
  casos de fallo (usuario inexistente, inactivo, eliminado lógicamente,
  password incorrecta) — evita enumeración de usuarios. Interna y
  funcionalmente cada caso se verifica y prueba por separado, tal como pide
  esta fase; solo el mensaje externo es uniforme.
- **`id` serializado como `string`** en `UsuarioResponseDto`: los ids de
  Prisma son `BigInt`, que `JSON.stringify` no puede serializar de forma
  nativa; convertir a `string` en el mapper evita el error y no pierde
  precisión (mejor que convertir a `number`).
- **Verificación de duplicados en dos niveles**: primero una consulta
  explícita (`buscarPorUsuario`/`buscarPorCorreo`) para devolver un 409 claro
  antes de tocar la base, y además un `catch` del código `P2002` de Prisma
  como red de seguridad ante condiciones de carrera (dos requests
  simultáneos).
- **Los usuarios eliminados lógicamente cuentan como "usuario ya en uso"**
  para `usuario`/`correo`: el `@unique` de la Fase 2 es un índice único
  simple en MySQL (no parcial excluyendo `deleted_at`), así que un
  `usuario`/`correo` de una cuenta eliminada queda bloqueado permanentemente
  a nivel de base de datos. Es una consecuencia directa del esquema ya
  aprobado en Fase 2, no una decisión nueva; si se necesita reutilizar esos
  identificadores tras un borrado lógico, requeriría revisar el esquema
  (índice único parcial, que MySQL no soporta de forma nativa sin columnas
  generadas) — dejar anotado para una futura fase si el negocio lo pide.
- **Paginación y DTO de respuesta paginada** movidos a `common/dto/` para
  que los demás módulos (tiendas, pedidos, etc.) los reutilicen sin
  duplicar código.
- `ParseIntPipe` en los parámetros de ruta (`:id`) + conversión a `BigInt`
  antes de llegar al service/repository, que trabajan siempre con `bigint`
  (mismo tipo que Prisma).

### Pruebas realizadas (manuales, contra MySQL real vía `node dist/src/main.js`)

Todas verificadas con resultado correcto:

- Crear usuario administrador → 201.
- Crear con `usuario` duplicado → 409.
- Crear con `correo` duplicado → 409.
- Validaciones: correo inválido, password corta (<8), rol inválido → 400
  cada uno, con mensaje claro de `class-validator`.
- Buscar por id existente → 200; id inexistente → 404.
- Listado con paginación y filtro parcial por `usuario` → 200.
- Actualizar correo de un usuario → 200; `password_hash` nunca aparece en
  ninguna respuesta (verificado explícitamente).
- `POST /auth/register` → crea con `rol=motorizado` sin importar qué se
  envíe; si el body incluye `rol`, el `ValidationPipe` lo rechaza con 400
  (`property rol should not exist`) antes de llegar a la lógica de negocio.
- Login correcto con `usuario` → 200; login correcto con `correo` → 200.
- Login con password incorrecta → 401.
- Login con usuario inexistente → 401.
- Desactivar usuario → login → 401; reactivar → login → 200.
- Eliminar lógicamente → `GET /usuarios/:id` pasa a 404 (tratado como
  inexistente); login → 401; el usuario desaparece del listado.
- `tsc --noEmit`, `npm run build`, `npm run lint` sin errores.
- Suite de tests por defecto (unit + e2e) sigue pasando con los nuevos
  módulos registrados en `AppModule`.

Datos de prueba eliminados de la base de datos al finalizar (no queda
ningún usuario de prueba en `delivery_system`).

### Estado actual del desarrollo

Módulo Usuarios y Auth completos y verificados end-to-end. Sin JWT, guards,
refresh tokens, cookies, sesiones ni OAuth (explícitamente diferidos). Sin
otros módulos de negocio (tiendas, pedidos, etc.).

---

## Fase 4 — Módulos de Tiendas y Sucursales

**Fecha:** 2026-07-12

### Alcance de esta fase

CRUD completo de **Tiendas** y **Sucursales**, reutilizando exactamente la
arquitectura de la Fase 3 (Controller → Service → Repository detrás de
interfaz con token DI → Mapper). No se modificó Usuarios/Auth ni el
`schema.prisma`. No se tocaron Clientes, Pedidos, Motorizados, Historial,
Fotos ni Incidentes.

### Conflicto detectado y resuelto (instrucción vs. esquema ya migrado)

**Problema:** esta fase pide `telefono` opcional en Sucursales, pero en la
Fase 2 (aprobada explícitamente) `sucursales.telefono` se migró como
`VARCHAR(20) NOT NULL`, y esta misma fase prohíbe modificar el esquema. Son
dos instrucciones contradictorias entre sí, no algo resoluble solo con
criterio técnico.

**Decisión aprobada:** mantener `telefono` obligatorio en
`CreateSucursalDto`/`UpdateSucursalDto` (igual que la columna real). Queda
pendiente para una fase futura, si se autoriza tocar el esquema, migrar la
columna a `String?` para que sea real y verdaderamente opcional.

### Ambigüedad funcional detectada y resuelta

**Situación:** `Tienda.nombre` y `Tienda.ruc` no tienen restricción
`UNIQUE` en la base de datos (no autorizado a agregarla esta fase), así que
"no permitir duplicados" solo puede aplicarse a nivel de aplicación. No
estaba definido si una tienda eliminada lógicamente debía seguir
bloqueando su nombre/ruc para tiendas nuevas o liberarlos.

**Decisión aprobada:** una tienda eliminada lógicamente **sigue bloqueando**
su `nombre`/`ruc` (comportamiento más conservador). Verificado con prueba
manual: intentar crear una tienda con el nombre de una tienda ya eliminada
devuelve 409.

### Observación de arquitectura (informativa, sin acción esta fase)

`Tienda.nombre` y `Tienda.ruc` carecen de índice `UNIQUE` en la base de
datos real (el ER original solo marcaba `correo` de `USUARIOS` como único;
la regla de "sin duplicados" para Tiendas es nueva de esta fase). La
validación de duplicados se hace hoy únicamente a nivel de aplicación
(consulta previa + `catch` de `P2002` como red de seguridad, igual que en
Usuarios), lo que deja una ventana teórica de condición de carrera ante dos
requests simultáneos, ya que no hay una restricción real de base de datos
que lo impida. Recomendación para una fase futura que autorice tocar el
esquema: agregar `@@unique` a `nombre` y a `ruc` en `Tienda`. No se actúa
sobre esto ahora, solo se deja documentado.

### Estructura de los módulos

```
src/modules/tiendas/
  dto/
    create-tienda.dto.ts        (nombre obligatorio, ruc opcional)
    update-tienda.dto.ts        (PartialType de CreateTiendaDto)
    tienda-response.dto.ts
    list-tiendas-query.dto.ts   (extiende PaginationQueryDto + nombre)
  interfaces/tiendas-repository.interface.ts  (puerto + token DI)
  tiendas.repository.ts
  tiendas.mapper.ts
  tiendas.service.ts
  tiendas.controller.ts
  tiendas.module.ts

src/modules/sucursales/
  dto/
    create-sucursal.dto.ts   (tiendaId, nombre, direccion, telefono obligatorios;
                               referencia, esPrincipal opcionales)
    update-sucursal.dto.ts   (PartialType de CreateSucursalDto)
    sucursal-response.dto.ts
    list-sucursales-query.dto.ts  (extiende PaginationQueryDto + tiendaId, nombre)
  interfaces/sucursales-repository.interface.ts
  sucursales.repository.ts
  sucursales.mapper.ts
  sucursales.service.ts   (inyecta TiendasService para validar la tienda padre)
  sucursales.controller.ts
  sucursales.module.ts    (importa TiendasModule)
```

`SucursalesService` reutiliza `TiendasService.buscarPorId()` (ya lanza
`NotFoundException` si la tienda no existe o está eliminada lógicamente)
para validar la tienda padre al crear o al reasignar `tiendaId` en una
actualización — evita duplicar la lógica de "tienda existe y no está
eliminada" (DRY).

### Endpoints implementados

| Método | Ruta                             | Descripción                                                     |
| ------ | -------------------------------- | --------------------------------------------------------------- |
| POST   | `/api/v1/tiendas`                | Crear tienda                                                    |
| GET    | `/api/v1/tiendas`                | Listar con paginación + búsqueda por nombre                     |
| GET    | `/api/v1/tiendas/:id`            | Buscar por id                                                   |
| PATCH  | `/api/v1/tiendas/:id`            | Actualizar                                                      |
| PATCH  | `/api/v1/tiendas/:id/activar`    | Activar                                                         |
| PATCH  | `/api/v1/tiendas/:id/desactivar` | Desactivar                                                      |
| DELETE | `/api/v1/tiendas/:id`            | Eliminación lógica                                              |
| POST   | `/api/v1/sucursales`             | Crear sucursal (valida tienda existente y activa)               |
| GET    | `/api/v1/sucursales`             | Listar con paginación + filtro `tiendaId` + búsqueda por nombre |
| GET    | `/api/v1/sucursales/:id`         | Buscar por id                                                   |
| PATCH  | `/api/v1/sucursales/:id`         | Actualizar                                                      |
| DELETE | `/api/v1/sucursales/:id`         | Eliminación lógica                                              |

Todos documentados en Swagger, agrupados en los tags `Tiendas` y
`Sucursales`.

Nota: Sucursales no tiene endpoints `activar`/`desactivar` porque el
modelo (Fase 2) no le agregó un campo `activo` — solo `deletedAt`. No
estaba pedido en esta fase tampoco, consistente con el esquema.

### Decisiones técnicas

- **"Consultar sucursales por tienda"** implementado como filtro
  (`GET /sucursales?tiendaId=X`) sobre el mismo endpoint de listado, en vez
  de una ruta anidada (`/tiendas/:id/sucursales`) — evita duplicar lógica de
  paginación/listado (DRY), mismo patrón que los filtros de Usuarios.
- **Activar/desactivar y eliminar lógico como endpoints propios** en
  Tiendas, igual que en Usuarios — no como campos editables en
  `UpdateTiendaDto`.
- **`buscarPorNombre`/`buscarPorRuc` no filtran `deletedAt`** (a diferencia
  de las demás consultas), por la decisión aprobada de que una tienda
  eliminada sigue bloqueando su nombre/ruc.
- Mismo patrón de manejo de duplicados que Usuarios: pre-chequeo explícito
  (409 con mensaje claro) + `catch` de `P2002` como red de seguridad.
- `esPrincipal` incluido como campo opcional (`default: false`) en los DTOs
  de Sucursal para completar el CRUD según el modelo de Fase 2, aunque no
  estaba en la lista explícita de validaciones de esta fase.

### Pruebas realizadas (manuales, contra MySQL real vía `node dist/src/main.js`)

**Tiendas:** crear (201); duplicidad de nombre (409); duplicidad de RUC
(409); crear sin RUC (201, opcional); nombre vacío (400); buscar por id
(200) e inexistente (404); listado paginado; búsqueda por nombre parcial;
actualizar (200); desactivar → reactivar (200); eliminar lógicamente (200);
buscar/actualizar/activar una tienda eliminada → 404 en los tres casos;
crear una tienda nueva con el nombre de una ya eliminada → 409 (confirma la
decisión aprobada).

**Sucursales:** crear para tienda existente (201); crear para tienda
inexistente (404); crear para tienda eliminada lógicamente (404); nombre
vacío (400); dirección faltante (400); teléfono faltante (400, por la
decisión de mantenerlo obligatorio); buscar por id (200) e inexistente
(404); listado paginado; consultar sucursales por tienda vía
`?tiendaId=` (200, filtra correctamente); actualizar (200); actualizar
asignando una tienda inexistente (404); eliminar lógicamente (200); la
sucursal eliminada desaparece del listado por tienda.

`prisma validate` ✓ · `prisma generate` ✓ · `tsc --noEmit` ✓ ·
`npm run build` ✓ · `npm run lint` ✓ · suite de tests por defecto
(unit + e2e) sigue pasando con los nuevos módulos registrados en
`AppModule`. Datos de prueba eliminados de la base de datos al finalizar.

### Estado actual del desarrollo

Módulos Usuarios, Auth, Tiendas y Sucursales completos y verificados
end-to-end. Sin Clientes, Pedidos, Motorizados, Historial, Fotos ni
Incidentes (fuera de alcance de esta fase). Sin JWT/guards (diferido).

### Observaciones para las siguientes fases

- Migración pendiente (requiere autorización de tocar el esquema):
  `sucursales.telefono` a `String?`.
- Mejora de arquitectura sugerida (requiere autorización): `@@unique` en
  `Tienda.nombre` y `Tienda.ruc`.
- El módulo de Pedidos (próxima fase natural) dependerá de
  `SucursalesService`/`ClientesService` de la misma forma en que
  Sucursales depende hoy de `TiendasService`.

---

## Fase 5 — Módulo de Clientes

**Fecha:** 2026-07-12

### Alcance de esta fase

CRUD completo de **Clientes**, mismo patrón arquitectónico de las fases
anteriores. No se tocaron Usuarios, Auth, Tiendas ni Sucursales. No se
modificó el `schema.prisma`. No se implementaron Pedidos, Motorizados,
Historial, Fotos ni Incidentes.

### Decisión explícita de esta fase: sin reglas de duplicidad

A diferencia de Usuarios (correo/usuario únicos) y Tiendas (nombre/RUC sin
duplicados, decidido en Fase 4), esta fase indicó expresamente **no
inventar** ninguna regla de duplicidad para Clientes, ya que la
documentación funcional no la define. Se implementó en consecuencia:

- No hay `validarXDisponible` ni chequeo de duplicados en
  `ClientesService`.
- No hay `catch` de `P2002` (no hay ninguna restricción única en el modelo
  de `Cliente` más allá de `id`, así que no hay nada que ese código pudiera
  capturar).
- Verificado con prueba manual: se creó un segundo cliente con el mismo
  `nombreCompleto` y el mismo `telefono` que uno ya existente, y la API lo
  permitió sin error (201), confirmando que no se coló ninguna validación
  no solicitada.

Como consecuencia directa, este módulo no genera nunca un `409 Conflict`
de forma natural (no existe ninguna condición de conflicto definida en el
alcance de esta fase); los códigos usados son `400` (validación) y `404`
(no encontrado).

### Estructura del módulo

```
src/modules/clientes/
  dto/
    create-cliente.dto.ts   (nombreCompleto, telefono, direccion obligatorios;
                              documentoIdentidad opcional)
    update-cliente.dto.ts   (PartialType de CreateClienteDto)
    cliente-response.dto.ts
    list-clientes-query.dto.ts  (extiende PaginationQueryDto + nombre, telefono,
                                  documentoIdentidad)
  interfaces/clientes-repository.interface.ts  (puerto + token DI)
  clientes.repository.ts
  clientes.mapper.ts
  clientes.service.ts
  clientes.controller.ts
  clientes.module.ts
```

Mismo patrón Controller → Service → Repository (detrás de interfaz con
token) → Mapper que en Usuarios/Tiendas/Sucursales. Sin lógica de negocio
en el controller. Sin campo `activo` ni endpoints activar/desactivar,
porque el modelo de `Cliente` (Fase 2) no tiene ese campo — solo
`deletedAt`, tal como esta fase indicó explícitamente.

### Endpoints implementados

| Método | Ruta                   | Descripción                                                    |
| ------ | ---------------------- | -------------------------------------------------------------- |
| POST   | `/api/v1/clientes`     | Crear cliente                                                  |
| GET    | `/api/v1/clientes`     | Listar con paginación + búsqueda por nombre/telefono/documento |
| GET    | `/api/v1/clientes/:id` | Buscar por id                                                  |
| PATCH  | `/api/v1/clientes/:id` | Actualizar                                                     |
| DELETE | `/api/v1/clientes/:id` | Eliminación lógica (`deletedAt`)                               |

Documentado en Swagger, tag `Clientes`.

### Decisiones técnicas

- Filtros de búsqueda (`nombre`, `telefono`, `documentoIdentidad`) todos
  con coincidencia parcial (`contains`), igual que los filtros ya
  existentes en Usuarios/Tiendas/Sucursales, y combinables entre sí y con
  paginación.
- `buscarPorId` filtra `deletedAt: null`, por lo que un cliente eliminado
  lógicamente se comporta como "no encontrado" (404) tanto para consulta
  como para actualización y para un segundo intento de eliminación — mismo
  patrón que Usuarios/Tiendas/Sucursales, sin necesidad de lógica nueva.

### Pruebas realizadas (manuales, contra MySQL real vía `node dist/src/main.js`)

Crear cliente completo (201); crear sin documento de identidad (201,
opcional); nombre/dirección/teléfono faltantes → 400 cada uno; crear un
segundo cliente con nombre y teléfono duplicados de uno existente → 201
(confirma que no se inventó ninguna regla de duplicidad); buscar por id
(200) e inexistente (404); listado paginado; búsqueda por nombre parcial,
por teléfono parcial y por documento de identidad (200 cada una);
actualizar (200); eliminar lógicamente (200); consultar cliente eliminado
→ 404; actualizar cliente eliminado → 404; eliminar un id inexistente →
404; el cliente eliminado desaparece del listado/búsqueda.

`prisma validate` ✓ · `prisma generate` ✓ · `tsc --noEmit` ✓ ·
`npm run build` ✓ · `npm run lint` ✓ · suite de tests por defecto
(unit + e2e) sigue pasando. Datos de prueba eliminados de la base de datos
al finalizar.

### Estado actual del desarrollo

Módulos Usuarios, Auth, Tiendas, Sucursales y Clientes completos y
verificados end-to-end. Sin Pedidos, Motorizados, Historial, Fotos ni
Incidentes (fuera de alcance). Sin JWT/guards (diferido).

### Observaciones para las siguientes fases

- Igual que con Tiendas, si en el futuro se define una regla de negocio
  de duplicidad para Clientes (p. ej. por `documentoIdentidad`), sería una
  ambigüedad funcional a resolver con aprobación explícita antes de
  implementarla — no hay nada que indique esa necesidad hoy.
- El módulo de Pedidos (próxima fase natural) dependerá de
  `ClientesService`/`SucursalesService` para validar `cliente_id` y
  `sucursal_id`, con el mismo patrón de reutilización ya usado entre
  Sucursales y Tiendas.

---

## Fase 6 — Módulo de Perfiles de Motorizados

**Fecha:** 2026-07-12

### Alcance de esta fase

CRUD completo de **Perfiles de Motorizados**, relacionado 1-a-1 con
Usuarios. No se modificó Usuarios ni Auth. No se tocó el `schema.prisma`.
No se implementaron Pedidos, Historial, Fotos ni Incidentes.

### Observación de arquitectura: duplicidad de placa (documentada, sin implementar)

**Situación:** la documentación funcional no especifica si `placa` debe
ser única entre perfiles de motorizados. Esta fase indicó explícitamente no
agregar esa restricción por criterio técnico, y clasificarla como
Observación de Arquitectura si se considera recomendable.

**Observación:** en la práctica dos motorizados no deberían compartir la
misma placa de vehículo (llevaría a ambigüedad al identificar qué
motorizado condujo un vehículo determinado en un reporte o incidente). Sin
embargo, esto no está confirmado por ningún caso de uso ni por la sección
4.1 del documento, así que **no se implementó ninguna validación de
unicidad sobre `placa`** — se puede crear más de un perfil con la misma
placa. Verificado con prueba manual.

**Recomendación (pendiente de tu aprobación):** si se confirma que la
placa debe ser única, agregar `@@unique` a `PerfilMotorizado.placa` en el
esquema (requeriría una migración) y el mismo patrón de pre-chequeo +
`catch P2002` ya usado en Usuarios/Tiendas. No se actúa sobre esto ahora.

### Decisión de diseño: `usuarioId` inmutable tras la creación

La documentación no define si un perfil puede reasignarse a otro usuario.
No se trata de una ambigüedad de negocio que deba consultarse, sino de una
funcionalidad no solicitada que se optó por **no construir**: `usuarioId`
no aparece en `UpdatePerfilMotorizadoDto`
(`OmitType(CreatePerfilMotorizadoDto, ['usuarioId'])`). Solo `placa` y
`estado` son editables. Verificado con prueba manual: enviar `usuarioId`
en un `PATCH` es rechazado con 400 (`property usuarioId should not
exist`) por el `ValidationPipe` global, antes de llegar a la lógica de
negocio.

### Transacciones de Prisma: no se usaron (justificación)

Se revisó cada operación del módulo para decidir si requería
`prisma.$transaction`:

- **Crear**: solo _lee_ `Usuario` (vía `UsuariosService.buscarPorId`) para
  validar existencia/estado/rol; el único `write` es sobre
  `PerfilMotorizado`. No modifica dos entidades.
- **Actualizar**: solo escribe sobre `PerfilMotorizado` (`placa`/`estado`).
  No toca `Usuario` en absoluto, porque `usuarioId` no es editable (ver
  punto anterior).
- **Eliminar**: solo borra el registro de `PerfilMotorizado`. No toca
  `Usuario`.

Como ninguna operación de este módulo escribe en `usuarios` y
`perfiles_motorizados` a la vez, **no se usó ninguna transacción** — habría
sido una transacción innecesaria (explícitamente desaconsejado). Si en una
fase futura se agrega alguna operación que sí escriba en ambas tablas (por
ejemplo, un endpoint que cree el usuario y su perfil en un solo paso), esa
sería el primer caso real que justificaría `$transaction` en este módulo.

### Estructura del módulo

```
src/modules/perfiles-motorizados/
  dto/
    create-perfil-motorizado.dto.ts  (usuarioId, placa, estado obligatorios)
    update-perfil-motorizado.dto.ts  (PartialType de Create sin usuarioId)
    perfil-motorizado-response.dto.ts
    list-perfiles-motorizados-query.dto.ts  (+ usuarioId, estado, placa)
  interfaces/perfiles-motorizados-repository.interface.ts  (puerto + token DI)
  perfiles-motorizados.repository.ts
  perfiles-motorizados.mapper.ts
  perfiles-motorizados.service.ts   (inyecta UsuariosService)
  perfiles-motorizados.controller.ts
  perfiles-motorizados.module.ts    (importa UsuariosModule)
```

Mismo patrón Controller → Service → Repository (interfaz + token) →
Mapper. `PerfilesMotorizadosService` reutiliza
`UsuariosService.buscarPorId()` (ya valida existencia y no-eliminado, y
expone `activo`/`rol` en el DTO de respuesta) para las 4 validaciones de
negocio exigidas — sin duplicar lógica ni tocar la entidad Prisma cruda de
`Usuario` (nunca se toca `password_hash`).

### Endpoints implementados

| Método | Ruta                               | Descripción                                                                                      |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| POST   | `/api/v1/perfiles-motorizados`     | Crear perfil (valida usuario existente, activo, no eliminado, rol motorizado, sin perfil previo) |
| GET    | `/api/v1/perfiles-motorizados`     | Listar con paginación + filtros por `usuarioId`, `estado`, `placa`                               |
| GET    | `/api/v1/perfiles-motorizados/:id` | Buscar por id                                                                                    |
| PATCH  | `/api/v1/perfiles-motorizados/:id` | Actualizar `placa`/`estado`                                                                      |
| DELETE | `/api/v1/perfiles-motorizados/:id` | Eliminación **física** (el modelo no tiene `deletedAt`)                                          |

Documentado en Swagger, tag `Perfiles de Motorizados`.

### Decisiones técnicas

- **Eliminación física**, no lógica: `PerfilMotorizado` no tiene columna
  `deletedAt` en el esquema de la Fase 2 — se usó `prisma.perfilMotorizado.delete()`
  tal cual el modelo lo define, sin modificar el esquema.
- **"No administrador" y "rol motorizado" se resuelven con una sola
  verificación** (`usuario.rol !== RolUsuario.motorizado`), ya que el enum
  `RolUsuario` solo tiene 2 valores posibles — cubre ambos requisitos
  explícitos sin duplicar lógica.
- **Manejo de errores**: `404` (usuario o perfil no encontrado/eliminado),
  `409` (usuario inactivo, usuario no motorizado, perfil duplicado para el
  mismo usuario, o intento de borrar un perfil con registros asociados vía
  `catch` de `P2003` — este último anticipa las Fases de Pedidos/Fotos/
  Incidentes, cuando existan FKs reales apuntando a `perfiles_motorizados`),
  `400` (validaciones de DTO).
- Pre-chequeo de "ya existe un perfil para este usuario"
  (`buscarPorUsuarioId`) + `catch` de `P2002` como red de seguridad, mismo
  patrón que Usuarios/Tiendas — aunque aquí el `@unique` sí existe en el
  esquema (`usuarioId`), a diferencia de Tiendas.

### Pruebas realizadas (manuales, contra MySQL real vía `node dist/src/main.js`)

Crear perfil correcto (201); usuario inexistente (404); usuario eliminado
lógicamente (404); usuario inactivo (409); usuario administrador (409);
segundo perfil para el mismo usuario (409); placa vacía (400); estado
inválido (400); buscar por id (200) e inexistente (404); buscar por
estado, por usuario y por placa parcial (200 cada uno); paginación;
actualizar placa/estado (200); intentar modificar `usuarioId` vía PATCH →
400 (rechazado por el `ValidationPipe`, confirma la inmutabilidad);
actualizar perfil inexistente (404); eliminar perfil (200, verificado que
es un `DELETE` físico consultando la tabla directamente — la fila
desaparece por completo, no queda con `deletedAt`); eliminar perfil
inexistente (404).

`prisma validate` ✓ · `prisma generate` ✓ · `tsc --noEmit` ✓ ·
`npm run build` ✓ · `npm run lint` ✓ · suite de tests por defecto
(unit + e2e) sigue pasando. Datos de prueba (usuarios y perfiles)
eliminados de la base de datos al finalizar.

### Estado actual del desarrollo

Módulos Usuarios, Auth, Tiendas, Sucursales, Clientes y Perfiles de
Motorizados completos y verificados end-to-end. Sin Pedidos, Historial,
Fotos ni Incidentes (fuera de alcance). Sin JWT/guards (diferido).

### Observaciones para las siguientes fases

- **Pendiente de aprobación**: `@@unique` en `PerfilMotorizado.placa`, si
  se confirma que dos motorizados no deben compartir placa (ver
  observación de arquitectura arriba).
- El módulo de Pedidos (próxima fase natural) dependerá de
  `PerfilesMotorizadosService` para validar `motorizado_actual_id` al
  asignar/reasignar un motorizado a un pedido, con el mismo patrón de
  reutilización ya usado en Sucursales→Tiendas y
  PerfilesMotorizados→Usuarios.
- El caso de `$transaction` mencionado en el objetivo de esta fase
  ("siempre que una operación requiera modificar información de ambas
  entidades") no tuvo ningún escenario real dentro del alcance de
  Perfiles de Motorizados; es más probable que aparezca en la Fase de
  Pedidos (p. ej., al reasignar un motorizado y registrar el evento en
  `historial_pedido` en la misma operación).

---

## Fase 7 — Módulo de Pedidos

**Fecha:** 2026-07-12

### Alcance de esta fase

CRUD completo de **Pedidos** (registro, sin asignación de motorizado, sin
cambios de estado, sin historial). No se modificó ningún módulo anterior ni
el `schema.prisma`. No se implementó Historial de Pedidos, Fotos de
Entrega ni Incidentes.

### Ambigüedad funcional resuelta: generación de `codigoPedido`

**Situación:** la documentación funcional solo dice "Código autogenerado,
único" (sección 4.1), sin especificar formato ni algoritmo. Se me indicó
explícitamente no usar UUID, timestamp ni inventar un prefijo.

**Decisión aprobada:** `codigoPedido = id.toString()` — se reutiliza el
`id` autoincremental (ya único y autogenerado por MySQL/Prisma) sin
inventar ningún formato adicional.

**Detalle técnico derivado (documentado, no bloqueante):** el `id` no se
conoce antes del `INSERT`, así que asignar `codigoPedido = id` requiere dos
sentencias: crear el pedido y luego actualizar ese mismo campo. Ambas
sentencias afectan la **misma fila** de la **misma tabla** (`pedidos`), no
dos entidades distintas — pero dejar el `INSERT` sin el `UPDATE` posterior
(por ejemplo, si el proceso fallara entre medio) dejaría una fila con un
código placeholder inválido, una inconsistencia real dentro de la propia
tabla. Por eso ambas sentencias se envolvieron en un único
`prisma.$transaction()`: es atómico (todo o nada) y ningún lector externo
puede observar el valor transitorio, gracias al aislamiento estándar de
transacciones de MySQL/InnoDB. El valor transitorio usado internamente
(`tmp_` + 20 caracteres hexadecimales aleatorios) nunca se expone en
ninguna respuesta ni queda persistido — se sobrescribe con
`id.toString()` antes de que la transacción confirme (`commit`). Esto es
una necesidad técnica para satisfacer la columna `codigo_pedido`
(`NOT NULL UNIQUE`) durante el instante entre el `INSERT` y el `UPDATE`,
no una decisión de formato de negocio: el valor final que ve cualquier
cliente de la API siempre es `codigoPedido = id`, tal como se aprobó.

### Decisiones de diseño (documentadas, sin bloquear)

- **`motorizadoActualId` no aparece en `CreatePedidoDto`**: el pedido se
  crea siempre sin motorizado asignado, tal como exige esta fase. La
  interfaz `CrearPedidoData` del repositorio ni siquiera contempla este
  campo, reforzando la regla a nivel de tipos (no solo de validación).
- **`estado` no aparece en `CreatePedidoDto` ni en `UpdatePedidoDto`**: el
  repositorio siempre usa el valor por defecto del esquema (`pendiente`,
  ya definido en Prisma) al crear, y no se implementó ningún mecanismo
  para cambiarlo — los cambios de estado quedan explícitamente para la
  fase de Historial de Pedidos.
- **`sucursalId`, `clienteId` y `creadoPorId` no son editables** en
  `UpdatePedidoDto` (excluidos vía `OmitType`) — mismo criterio conservador
  aplicado a `usuarioId` en Perfiles de Motorizados (Fase 6): no se
  construyó una capacidad de "reasignar" el pedido a otro cliente/sucursal
  que no fue solicitada ni está respaldada por ningún caso de uso.
- **Validación del `creadoPorId` limitada exactamente a lo pedido**: esta
  fase solo exige verificar que el usuario creador "existe" y "no está
  eliminado" — a diferencia de Perfiles de Motorizados (Fase 6), que sí
  exigía además `activo` y `rol`. Aunque CU01 asocia el registro de
  pedidos al rol Administrador, **no se agregó ningún chequeo de `activo`
  ni de `rol` sobre `creadoPorId`**, seleccionar precisamente porque esta
  fase no lo pidió explícitamente y la regla del proyecto es "no inventes
  validaciones adicionales". Se deja como observación por si se desea
  igualar el criterio a Perfiles de Motorizados en una fase futura.
- **Eliminación física** (no lógica): `Pedido` no tiene columna
  `deletedAt` en el esquema de la Fase 2 (ni en el ER original) — se
  implementó `prisma.pedido.delete()` tal cual el modelo lo define, sin
  tocar el esquema. Nota: la documentación no describe ningún caso de uso
  de "eliminar pedido" (CU04 es "Cancelar Pedido", un cambio de estado,
  explícitamente fuera de alcance de esta fase) — se implementó el
  `DELETE` físico solo porque esta fase lo pidió explícitamente como parte
  del CRUD ("Eliminar pedido respetando el comportamiento definido por el
  modelo de datos"), no porque exista un CU que lo describa.

### Historial de Pedidos: no se registró ningún evento (según lo pedido)

No se escribió nada en `historial_pedido` desde este módulo — ni al crear,
ni al actualizar, ni al eliminar. No hizo falta ninguna operación que
dependiera del historial para mantener consistencia; no se encontró
ningún caso que requiriera documentarse bajo esa regla.

### Transacciones de Prisma

Además del caso de `codigoPedido` (mismo entidad, ver arriba), se revisó
si alguna operación de este módulo escribe en más de una tabla:

- **Crear**: solo _lee_ `Sucursal`/`Cliente`/`Usuario` para validar; el
  único `write` es sobre `Pedido` (dentro de la transacción ya descrita).
- **Actualizar**: solo escribe sobre `Pedido`. No toca ninguna otra tabla.
- **Eliminar**: solo borra de `Pedido`. No toca ninguna otra tabla.

Ninguna operación de este módulo escribe en dos _entidades_ distintas a la
vez, por lo que no se usó `$transaction` para ese propósito — solo para el
caso de consistencia intra-fila ya explicado.

### Estructura del módulo

```
src/modules/pedidos/
  dto/
    create-pedido.dto.ts   (sucursalId, clienteId, creadoPorId, direccionEntrega
                             obligatorios; resto opcional; sin codigoPedido,
                             estado ni motorizadoActualId)
    update-pedido.dto.ts   (PartialType de Create sin sucursalId/clienteId/creadoPorId)
    pedido-response.dto.ts
    list-pedidos-query.dto.ts  (+ codigoPedido, clienteId, sucursalId, estado,
                                 fechaDesde, fechaHasta)
  interfaces/pedidos-repository.interface.ts  (puerto + token DI)
  pedidos.repository.ts   (contiene la transaccion create+codigoPedido)
  pedidos.mapper.ts        (BigInt/Decimal -> string, Date se serializa nativamente)
  pedidos.service.ts        (inyecta SucursalesService, ClientesService, UsuariosService)
  pedidos.controller.ts
  pedidos.module.ts         (importa SucursalesModule, ClientesModule, UsuariosModule)
```

Mismo patrón Controller → Service → Repository (interfaz + token) →
Mapper. `PedidosService` reutiliza `buscarPorId()` de los tres módulos
relacionados (ya validan existencia + no-eliminado) sin duplicar lógica ni
tocar las entidades Prisma crudas de esos módulos.

### Endpoints implementados

| Método | Ruta                  | Descripción                                                                            |
| ------ | --------------------- | -------------------------------------------------------------------------------------- |
| POST   | `/api/v1/pedidos`     | Registrar pedido (estado inicial `pendiente`, sin motorizado)                          |
| GET    | `/api/v1/pedidos`     | Listar con paginación + filtros por código, cliente, sucursal, estado, rango de fechas |
| GET    | `/api/v1/pedidos/:id` | Buscar por id                                                                          |
| PATCH  | `/api/v1/pedidos/:id` | Actualizar datos descriptivos del pedido                                               |
| DELETE | `/api/v1/pedidos/:id` | Eliminación **física** (el modelo no tiene `deletedAt`)                                |

Documentado en Swagger, tag `Pedidos`.

### Pruebas realizadas (manuales, contra MySQL real vía `node dist/src/main.js`)

Crear pedido correcto (201, verificado `codigoPedido == id`, `estado ==
pendiente`, `motorizadoActualId == null`, confirmado también directamente
en la tabla vía SQL); cliente inexistente (404); cliente eliminado
lógicamente (404); sucursal inexistente (404); sucursal eliminada
lógicamente (404); usuario creador inexistente (404); usuario creador
eliminado lógicamente (404); dirección obligatoria (400); crear con todos
los campos opcionales (201, `valorProducto`/`costoEnvio` serializados
como string); buscar por id (200) e inexistente (404); listado paginado;
filtros por `codigoPedido`, `clienteId`, `sucursalId`, `estado` y rango de
fechas (200 cada uno); actualizar campos descriptivos (200); intentar
modificar `sucursalId` o `estado` vía `PATCH` → 400 (rechazado por el
`ValidationPipe`, confirma la inmutabilidad); actualizar pedido inexistente
(404); eliminar pedido (200, verificado como `DELETE` físico contra la
tabla); eliminar pedido inexistente (404).

`prisma validate` ✓ · `prisma generate` ✓ · `tsc --noEmit` ✓ ·
`npm run build` ✓ · `npm run lint` ✓ · suite de tests por defecto
(unit + e2e) sigue pasando. Datos de prueba eliminados de la base de datos
al finalizar.

### Estado actual del desarrollo

Módulos Usuarios, Auth, Tiendas, Sucursales, Clientes, Perfiles de
Motorizados y Pedidos completos y verificados end-to-end. Sin Historial de
Pedidos, Fotos de Entrega ni Incidentes (fuera de alcance). Sin JWT/guards
(diferido).

### Observaciones para las siguientes fases

- **Fase de Asignación de Motorizado**: deberá agregar la lógica para
  poblar `motorizadoActualId` (hoy siempre `null` al crear) y,
  presumiblemente, registrar el evento correspondiente en
  `historial_pedido` — ese es el escenario más probable donde sí se
  necesitará `prisma.$transaction` real entre dos entidades (`pedidos` +
  `historial_pedido`) en todo el proyecto hasta ahora.
- **Fase de Historial de Pedidos**: deberá decidir si el cambio de
  `estado` en `pedidos` y el registro del evento en `historial_pedido` se
  hacen siempre atómicamente (esta fase no lo implementó, tal como se
  pidió).
- **Observación menor**: a diferencia de Perfiles de Motorizados,
  `creadoPorId` en Pedidos no se validó contra `activo`/`rol`
  (administrador), porque esta fase no lo exigió explícitamente. Si se
  desea uniformar el criterio, sería una decisión a aprobar antes de
  implementarla.

---

## Fase 8 — Flujo operativo del pedido (Historial y Evidencias Fotográficas)

**Fecha:** 2026-07-12

### Alcance de esta fase

Casos de uso reales de negocio (ya no CRUD): **Confirmar Recojo** (CU08),
**Iniciar Ruta** (CU09), **Confirmar Entrega** (CU10); más los módulos de
solo lectura **Historial de Pedidos** y **Fotos de Entrega**. No se
modificó ningún módulo anterior (Usuarios, Auth, Tiendas, Sucursales,
Clientes, Perfiles de Motorizados, Pedidos) ni el `schema.prisma`. No se
implementaron Incidentes.

### Puntos consultados y resueltos antes de implementar

**1. Falta "Asignar Motorizado" (CU05) como precondición.** Confirmar
Recojo exige que el pedido ya esté `asignado` con un `motorizado_actual_id`
— pero esa asignación (CU05) no está implementada (diferida desde la Fase
7, y no incluida en el alcance de esta fase). **Decisión aprobada:** no se
implementó ningún endpoint de asignación; para las pruebas se preparó la
precondición (`estado='asignado'`, `motorizado_actual_id`) directamente en
la base de datos vía SQL, sin exponer esa capacidad por la API.

**2. ¿Iniciar Ruta necesita `motorizadoId`?** La lista de requisitos de
Iniciar Ruta no mencionaba "verificar motorizado" (a diferencia de los
otros dos casos de uso), pero `historial_pedido.usuario_id` es `NOT NULL`
y CU09 dice que el actor es el Motorizado. **Decisión aprobada:** sí, se
exige `motorizadoId` también en Iniciar Ruta, verificado contra
`pedido.motorizado_actual_id`, igual que en los otros dos casos de uso.

### Casos de uso implementados

- **Confirmar Recojo** (`POST /pedidos/:id/confirmar-recojo`): valida
  pedido existente, motorizado válido y asignado a ese pedido, y
  `estado === 'asignado'`. Dentro de una única transacción: actualiza
  `pedidos.estado` a `recogido`, crea una fila en `fotos_entrega`
  (`tipo='recojo'`, `es_principal=true` siempre, ya que solo hay una foto
  de recojo), y crea el evento en `historial_pedido`
  (`tipo_evento='cambio_estado'`, `estado='recogido'`,
  `usuario_id` = el usuario del motorizado).
- **Iniciar Ruta** (`POST /pedidos/:id/iniciar-ruta`): valida pedido,
  motorizado asignado, y `estado === 'recogido'`. Transacción: actualiza
  `pedidos.estado` a `en_ruta` y crea el evento de historial. **No**
  registra fotos (tal como se pidió).
- **Confirmar Entrega** (`POST /pedidos/:id/confirmar-entrega`): valida
  pedido, motorizado asignado, y `estado === 'en_ruta'`. Acepta un arreglo
  de 1 o más fotos (`ArrayMinSize(1)`) y unas `observaciones` opcionales.
  Transacción: actualiza `pedidos.estado` a `entregado` (y
  `pedidos.observaciones` si se envió), crea una fila en `fotos_entrega`
  por cada foto del arreglo (`tipo='entrega'`, `es_principal` según lo que
  indique cada foto, por defecto `false`), y crea el evento de historial.
- **Historial de Pedidos** (`GET /pedidos/:id/historial`): solo lectura,
  paginado, ordenado cronológicamente. No existe forma de crear, editar
  ni eliminar un evento vía API — el repositorio de este módulo ni
  siquiera expone un método de escritura.
- **Fotos de Entrega** (`GET /pedidos/:id/fotos`): igual que el anterior,
  solo lectura y paginado. El repositorio no expone ningún método de
  escritura; las únicas fotos que pueden existir son las creadas por
  Confirmar Recojo/Entrega.

`pedidos.estado` sigue siendo la única fuente de verdad del estado actual;
`historial_pedido` es trazabilidad pura — en ningún momento se calculó el
estado a partir del historial.

### Transacciones de Prisma (obligatorias para escrituras multi-tabla)

Las 3 escrituras de negocio (Confirmar Recojo, Iniciar Ruta, Confirmar
Entrega) modifican **2 o 3 tablas** (`pedidos` + `fotos_entrega` +
`historial_pedido`, según el caso) y se ejecutan cada una dentro de un
único `prisma.$transaction(async (tx) => {...})`, todas las escrituras
usando el mismo cliente `tx`. Si cualquier escritura falla, Prisma revierte
automáticamente todo el bloque — no queda ninguna operación parcial (por
ejemplo, un cambio de estado sin su evento de historial correspondiente).
Verificado con pruebas: tras cada caso de uso exitoso, se confirmó
directamente en la base de datos que **todas** las filas esperadas
(pedido actualizado + foto(s) + evento de historial) existen juntas, con
los valores correctos (incluyendo `usuario_id` del motorizado, no del
administrador).

Todas las validaciones (pedido existe, motorizado válido y asignado,
estado compatible) se ejecutan **antes** de abrir la transacción, para que
ninguna transacción se inicie sobre una operación que ya se sabe inválida.

### Decisión de arquitectura: dónde vive la escritura multi-tabla

Para no modificar ningún archivo de los módulos Pedidos/Perfiles de
Motorizados ya existentes, se creó un módulo nuevo y propio
(`flujo-pedido`) con **su propio repositorio**, que es el único lugar del
proyecto que escribe directamente en `pedidos`, `fotos_entrega` e
`historial_pedido` juntos dentro de una transacción. Los módulos de
lectura (`historial-pedido`, `fotos-entrega`) tienen sus propios
repositorios, estrictamente de solo lectura (sin ningún método `crear`),
reforzando a nivel de arquitectura — no solo de controller — la regla
"no permitir crear historial/fotos manualmente". Las validaciones de
`flujo-pedido` reutilizan `PedidosService.buscarPorId()` y
`PerfilesMotorizadosService.buscarPorId()` (ya existentes, sin
modificarlos) en vez de duplicar lógica.

Cuatro controllers distintos (`PedidosController`, `HistorialPedidoController`,
`FotosEntregaController`, `FlujoPedidoController`) comparten el prefijo
`@Controller('pedidos')` sin conflicto, cada uno aportando sus propias
sub-rutas — permite el diseño REST anidado (`/pedidos/:id/historial`,
`/pedidos/:id/fotos`, `/pedidos/:id/confirmar-recojo`, etc.) sin tocar el
`PedidosController` original de la Fase 7.

### Estructura de los módulos

```
src/modules/historial-pedido/    (solo lectura)
  dto/historial-pedido-response.dto.ts
  interfaces/historial-pedido-repository.interface.ts  (solo buscarPorPedido)
  historial-pedido.repository.ts
  historial-pedido.mapper.ts
  historial-pedido.service.ts   (valida pedido via PedidosService)
  historial-pedido.controller.ts  (@Controller('pedidos'), GET ':id/historial')
  historial-pedido.module.ts     (importa PedidosModule)

src/modules/fotos-entrega/       (solo lectura)
  dto/foto-entrega-response.dto.ts
  interfaces/fotos-entrega-repository.interface.ts  (solo buscarPorPedido)
  fotos-entrega.repository.ts
  fotos-entrega.mapper.ts
  fotos-entrega.service.ts
  fotos-entrega.controller.ts    (@Controller('pedidos'), GET ':id/fotos')
  fotos-entrega.module.ts

src/modules/flujo-pedido/        (casos de uso de negocio)
  dto/
    foto-entrega-input.dto.ts   (urlImagen, esPrincipal opcional)
    confirmar-recojo.dto.ts      (motorizadoId, urlImagen)
    iniciar-ruta.dto.ts          (motorizadoId)
    confirmar-entrega.dto.ts     (motorizadoId, fotos[], observaciones opcional)
  interfaces/flujo-pedido-repository.interface.ts
  flujo-pedido.repository.ts     (las 3 transacciones $transaction)
  flujo-pedido.service.ts        (validaciones de negocio + orquestacion)
  flujo-pedido.controller.ts     (@Controller('pedidos'), 3 POST)
  flujo-pedido.module.ts         (importa PedidosModule, PerfilesMotorizadosModule)
```

### Endpoints implementados

| Método | Ruta                                    | Descripción                                              |
| ------ | --------------------------------------- | -------------------------------------------------------- |
| POST   | `/api/v1/pedidos/:id/confirmar-recojo`  | CU08 — foto de recojo, estado→`recogido`, historial      |
| POST   | `/api/v1/pedidos/:id/iniciar-ruta`      | CU09 — estado→`en_ruta`, historial (sin fotos)           |
| POST   | `/api/v1/pedidos/:id/confirmar-entrega` | CU10 — foto(s) de entrega, estado→`entregado`, historial |
| GET    | `/api/v1/pedidos/:id/historial`         | Consultar historial paginado de un pedido                |
| GET    | `/api/v1/pedidos/:id/fotos`             | Consultar fotos paginadas de un pedido                   |

Documentado en Swagger, tags `Flujo de Pedido`, `Historial de Pedidos`,
`Fotos de Entrega`.

### Pruebas realizadas (manuales, contra MySQL real vía `node dist/src/main.js`)

Precondición preparada vía SQL directo (tal como se aprobó):
`pedidos.estado='asignado'` + `motorizado_actual_id` seteado en 3 pedidos
de prueba.

**Confirmar Recojo:** correcto (201, verificado en BD: `pedidos.estado`,
`fotos_entrega` con `es_principal=1`, `historial_pedido` con
`usuario_id` = usuario del motorizado); pedido inexistente (404); sin
`urlImagen` (400); repetir sobre un pedido que ya no está `asignado`
(409, mensaje indica el estado actual).

**Iniciar Ruta:** correcto (201, verificado estado `en_ruta` +
historial); pedido inexistente (404); pedido todavía en `asignado`
(no `recogido`) → 409.

**Confirmar Entrega:** con una fotografía (201, `observaciones` guardada
en el pedido); con varias fotografías (201, verificado en BD: 2 filas en
`fotos_entrega`, una `es_principal=1` y otra `0`); pedido inexistente
(404); arreglo de fotos vacío (400, `ArrayMinSize`).

**Historial:** consulta por pedido (200, paginado, orden cronológico);
pedido inexistente (404).

**Fotos:** consulta por pedido (200, paginado, muestra correctamente las
2 fotos de un pedido con entrega múltiple); pedido inexistente (404).

**Transacciones:** verificado en cada caso, vía consulta SQL directa
posterior, que todas las filas esperadas de la operación (actualización
de `pedidos` + fila(s) de `fotos_entrega` + evento de `historial_pedido`)
existen juntas y con los valores correctos — ninguna operación quedó
parcial.

`prisma validate` ✓ · `prisma generate` ✓ · `tsc --noEmit` ✓ ·
`npm run build` ✓ · `npm run lint` ✓ · suite de tests por defecto
(unit + e2e) sigue pasando. Datos de prueba eliminados de la base de datos
al finalizar.

### Estado actual del desarrollo

Módulos Usuarios, Auth, Tiendas, Sucursales, Clientes, Perfiles de
Motorizados, Pedidos, Historial de Pedidos, Fotos de Entrega y Flujo de
Pedido completos y verificados end-to-end. Sin Incidentes (fuera de
alcance). Sin JWT/guards (diferido).

### Observaciones para las siguientes fases

- **CU05 "Asignar Motorizado" sigue pendiente**: es un prerrequisito real
  para que el flujo completo (Pendiente → Asignado → Recogido → En Ruta →
  Entregado) sea utilizable de punta a punta vía la API, sin preparar
  nada manualmente en la base de datos.
- Cuando se implemente Asignar Motorizado, probablemente también escriba
  en `historial_pedido` (`tipo_evento='reasignacion'`, usando el campo
  `motorizado_id` de esa tabla, que esta fase no utilizó en ningún
  momento) — sería el primer caso real de ese tipo de evento.
- Los estados alternativos del flujo (`cancelado`, `reprogramado`,
  `devuelto`, `rechazado`, `cliente_ausente`) tampoco se implementaron en
  esta fase — corresponden a los casos de uso CU04, CU11 y CU12, no
  mencionados en el alcance de la Fase 8.

---

## Fase 9 — Casos de uso restantes del flujo del pedido

**Fecha:** 2026-07-12

### Alcance de esta fase

Completa el flujo operativo del pedido dentro del **mismo módulo
`flujo-pedido`** (sin crear módulos nuevos para estos casos de uso, tal
como se indicó): **Asignar Motorizado** (CU05), **Reasignar Motorizado**
(CU06), **Registrar Cliente Ausente** (CU11), **Registrar Rechazo**
(CU12), **Reportar Incidente** (CU13) + el nuevo módulo **Incidentes**
(CRUD parcial: crear/consultar/listar). No se modificó ningún módulo
anterior, no se movió lógica ya implementada, y no se tocó el
`schema.prisma`. No se implementaron reportes.

### Ambigüedad funcional resuelta: CU13 y `historial_pedido`

**Situación:** CU13 pedía "registrar historial", pero
`TipoEventoHistorial` (Fase 2) solo tiene `cambio_estado` y
`reasignacion` — ninguno representa "incidente reportado" — y esta
misma fase decía explícitamente "no asumir cambios de estado" para
CU13.

**Decisión aprobada:** el módulo `incidentes` **no escribe en
`historial_pedido`**. Solo crea la fila en `incidentes`. Si en el futuro
se confirma que cierto tipo de incidente sí cambia el estado del pedido,
ese cambio (no el incidente en sí) generaría su propio evento
`cambio_estado`, igual que los demás casos de uso. Verificado con prueba:
tras crear un incidente sobre un pedido con historial existente, el
conteo de eventos de `historial_pedido` para ese pedido no cambió.

Como consecuencia de esta decisión, el módulo `incidentes` quedó
completamente autocontenido (no depende de `flujo-pedido` ni de
`historial-pedido`), consistente con "toda escritura de historial debe
seguir viniendo de flujo-pedido" — simplemente no hay escritura de
historial que hacer aquí.

### Casos de uso implementados (extendiendo `flujo-pedido`)

- **Asignar Motorizado** (`POST /pedidos/:id/asignar-motorizado`, CU05):
  valida pedido, motorizado y usuario administrador (existen), y que
  `estado === 'pendiente'`. Transacción: actualiza `pedidos.estado` a
  `asignado` y `pedidos.motorizado_actual_id`, y crea el evento de
  historial (`cambio_estado`, `estado='asignado'`, `usuario_id` = el
  administrador que asigna).
- **Reasignar Motorizado** (`POST /pedidos/:id/reasignar-motorizado`,
  CU06): valida pedido, que `motorizadoAnteriorId` coincida exactamente
  con `pedido.motorizado_actual_id` actual ("validar motorizado
  anterior"), que el nuevo motorizado exista, y que el usuario
  administrador exista. Transacción: actualiza
  `pedidos.motorizado_actual_id` (el `estado` no cambia — sigue siendo el
  que tuviera) y crea el evento de historial (`reasignacion`,
  `motorizado_id` = nuevo motorizado, sin `estado`).
- **Registrar Cliente Ausente** (`POST /pedidos/:id/cliente-ausente`,
  CU11): valida pedido, motorizado asignado (mismo patrón que Confirmar
  Recojo/Entrega de la Fase 8) y `estado === 'en_ruta'`. Transacción:
  `pedidos.estado` → `cliente_ausente` + historial. Sin fotos.
- **Registrar Rechazo** (`POST /pedidos/:id/rechazo`, CU12): igual
  patrón, `estado === 'en_ruta'` → `rechazado`. Sin fotos.

### Decisiones técnicas — validaciones aplicadas por consistencia

- **CU05/CU06 requieren un `usuarioId` explícito** (el administrador que
  asigna/reasigna) — no se valida `activo`/`rol` sobre ese usuario, mismo
  criterio ya aplicado a `creadoPorId` en Pedidos (Fase 7): la fase no lo
  exigió explícitamente para estos casos tampoco.
- **CU11/CU12 requieren `motorizadoId`** aunque no estaba en su lista
  explícita de requisitos — mismo razonamiento ya aprobado en la Fase 8
  para Iniciar Ruta (el actor es el Motorizado y `historial_pedido.usuario_id`
  es `NOT NULL`; se aplicó el patrón ya validado, no una ambigüedad
  nueva).
- **CU06 no exige un estado precondición adicional** más allá de que
  `motorizadoAnteriorId` coincida con el motorizado actualmente asignado
  — esta fase no especificó en qué estados es válido reasignar, y
  agregar una lista de estados excluidos habría sido inventar una regla.
  La validación del "motorizado anterior" ya garantiza que el pedido
  tiene una asignación vigente.
- **`resuelto` no es un campo del `CreateIncidenteDto`**: siempre se crea
  en `false` (default del esquema) — no tendría sentido que quien
  reporta un incidente lo marque como resuelto al mismo tiempo, y de
  todas formas no hay endpoint de actualización para cambiarlo después
  (no solicitado esta fase).

### Estructura (extensión de `flujo-pedido`, módulo nuevo `incidentes`)

```
src/modules/flujo-pedido/    (mismo modulo de la Fase 8, extendido)
  dto/
    asignar-motorizado.dto.ts        (motorizadoId, usuarioId)
    reasignar-motorizado.dto.ts      (motorizadoAnteriorId, motorizadoNuevoId, usuarioId)
    registrar-cliente-ausente.dto.ts (motorizadoId)
    registrar-rechazo.dto.ts         (motorizadoId)
  interfaces/flujo-pedido-repository.interface.ts  (+4 metodos)
  flujo-pedido.repository.ts   (+4 transacciones $transaction)
  flujo-pedido.service.ts      (+4 metodos, +UsuariosService inyectado)
  flujo-pedido.controller.ts   (+4 endpoints POST)
  flujo-pedido.module.ts       (+ importa UsuariosModule)

src/modules/incidentes/      (modulo nuevo, CRUD parcial)
  dto/
    create-incidente.dto.ts    (pedidoId opcional, motorizadoId y tipo obligatorios)
    incidente-response.dto.ts
    list-incidentes-query.dto.ts  (+ pedidoId, motorizadoId, tipo, resuelto)
  interfaces/incidentes-repository.interface.ts  (crear, buscarPorId, buscarMuchos — sin actualizar/eliminar)
  incidentes.repository.ts
  incidentes.mapper.ts
  incidentes.service.ts    (valida pedido si se envia, motorizado siempre)
  incidentes.controller.ts (@Controller('incidentes'), POST/GET/GET :id)
  incidentes.module.ts     (importa PedidosModule, PerfilesMotorizadosModule)
```

### Endpoints implementados

| Método | Ruta                                       | Descripción                                          |
| ------ | ------------------------------------------ | ---------------------------------------------------- |
| POST   | `/api/v1/pedidos/:id/asignar-motorizado`   | CU05 — estado→`asignado`, historial                  |
| POST   | `/api/v1/pedidos/:id/reasignar-motorizado` | CU06 — cambia motorizado, historial (`reasignacion`) |
| POST   | `/api/v1/pedidos/:id/cliente-ausente`      | CU11 — estado→`cliente_ausente`, historial           |
| POST   | `/api/v1/pedidos/:id/rechazo`              | CU12 — estado→`rechazado`, historial                 |
| POST   | `/api/v1/incidentes`                       | CU13 — crear incidente (sin historial)               |
| GET    | `/api/v1/incidentes`                       | Listar con paginación y filtros                      |
| GET    | `/api/v1/incidentes/:id`                   | Buscar por id                                        |

Documentado en Swagger, tags `Flujo de Pedido` e `Incidentes` (ya
existentes/nuevo respectivamente).

### Transacciones de Prisma

Las 4 escrituras nuevas de `flujo-pedido` (Asignar, Reasignar, Cliente
Ausente, Rechazo) modifican 2 tablas cada una (`pedidos` +
`historial_pedido`) y se ejecutan dentro de un único
`prisma.$transaction`, exactamente con el mismo patrón ya usado en la
Fase 8. `incidentes.crear()` **no** usa transacción porque escribe en una
sola tabla (`incidentes`) — no hay operación multi-tabla que proteger.

Verificado con pruebas: tras Asignar y luego Reasignar sobre el mismo
pedido, `historial_pedido` muestra ambos eventos completos y correctos
(`cambio_estado`/`asignado` con `motorizado_id=NULL`, luego
`reasignacion`/`motorizado_id=6` con `estado=NULL`), confirmando que cada
transacción escribió todo lo esperado.

### Pruebas realizadas (manuales, contra MySQL real vía `node dist/src/main.js`)

**Asignar Motorizado:** correcto (201, `estado→asignado`,
`motorizado_actual_id` seteado); pedido inexistente (404); motorizado
inexistente (404); reintentar sobre un pedido que ya no está `pendiente`
(409, mensaje con estado actual).

**Reasignar Motorizado:** correcto (201, `motorizado_actual_id` cambia,
`estado` no cambia, verificado en BD el evento `reasignacion`); pedido
inexistente (404); motorizado nuevo inexistente (404);
`motorizadoAnteriorId` que no coincide con el asignado (409).

**Cliente Ausente:** correcto (201, `estado→cliente_ausente`, probado
además llevando un pedido real por todo el flujo Asignar→Confirmar
Recojo→Iniciar Ruta usando los endpoints de la Fase 8, sin necesidad de
preparar nada por SQL esta vez); estado inválido — sin motorizado
asignado (409) y con motorizado asignado pero en estado `asignado` en
vez de `en_ruta` (409 con mensaje de estado específico).

**Rechazo:** mismo patrón — correcto (201, `estado→rechazado`); estado
inválido (409).

**Incidentes:** crear con pedido (201); crear sin pedido, ya que es
opcional "si aplica" (201, `pedidoId: null`); pedido inexistente (404);
motorizado inexistente (404); consultar por id (200); listar (200,
paginado); confirmado que crear un incidente no agrega ninguna fila a
`historial_pedido`.

`prisma validate` ✓ · `prisma generate` ✓ · `tsc --noEmit` ✓ ·
`npm run build` ✓ · `npm run lint` ✓ · suite de tests por defecto
(unit + e2e) sigue pasando. Datos de prueba eliminados de la base de
datos al finalizar.

### Estado actual del desarrollo

Flujo completo del pedido implementado de punta a punta: Registrar →
Asignar → Confirmar Recojo → Iniciar Ruta → Confirmar Entrega, con las
ramas alternativas Reasignar, Cliente Ausente y Rechazo, más registro de
Incidentes. Todos los módulos anteriores (Usuarios, Auth, Tiendas,
Sucursales, Clientes, Perfiles de Motorizados, Pedidos, Historial de
Pedidos, Fotos de Entrega) siguen intactos. Sin reportes (fuera de
alcance de esta fase). Sin JWT/guards (diferido).

### Cobertura funcional alcanzada

CU01 (Registrar Pedido), CU02 (Consultar Pedido), CU03 (Editar Pedido),
CU05 (Asignar Motorizado), CU06 (Reasignar Motorizado), CU07 (Ver
Pedidos Asignados — vía filtro `motorizadoActualId` no implementado
todavía como filtro directo, pendiente si se requiere), CU08 (Confirmar
Recojo), CU09 (Iniciar Ruta), CU10 (Confirmar Entrega), CU11 (Cliente
Ausente), CU12 (Rechazo), CU13 (Reportar Incidente), CU14 (Gestionar
Tiendas), CU15 (Gestionar Motorizados), CU16 (Consultar Historial del
Pedido), CU17 (Consultar Fotografías). Pendientes: CU04 (Cancelar
Pedido), CU18–CU20 (reportes).

### Observaciones para las siguientes fases

- **CU04 "Cancelar Pedido"** no se implementó (fuera del alcance
  explícito de las Fases 8 y 9) — usaría el mismo patrón de
  `verificarEstado` + transacción `pedidos` + `historial_pedido` ya
  establecido en `flujo-pedido`.
- **CU07 "Ver Pedidos Asignados"**: el listado de Pedidos ya soporta
  filtrar, pero no existe un filtro directo por `motorizadoActualId` en
  `ListPedidosQueryDto` (Fase 7) — si se requiere para este caso de uso,
  sería una extensión aditiva simple al filtro existente.
- Próxima fase natural: reportes (CU18, CU19, CU20), que probablemente
  reutilicen los filtros ya existentes de Pedidos/Historial/Incidentes
  sin necesitar nueva lógica de escritura.

## Fase 10 — Cancelación de Pedidos y Reportes

**Fecha:** 2026-07-13

### Alcance de esta fase

Completa la lógica funcional restante: **Cancelar Pedido** (CU04, dentro
del módulo `flujo-pedido` existente, sin usar el `PATCH` del CRUD de
Pedidos) y el nuevo módulo de solo consulta **`reportes`** con **Reporte
de Pedidos** (CU18), **Reporte de Entregas** (CU19) y **Reporte de
Motorizados** (CU20). No se modificó ningún módulo anterior, no se movió
lógica ya implementada, y no se tocó el `schema.prisma`.

### Ambigüedades funcionales resueltas (aprobadas antes de implementar)

**CU04 — ¿desde qué estados se puede cancelar un pedido?** La
documentación no lo especifica. Se presentaron 3 alternativas (solo
`pendiente`; `pendiente`/`asignado`; o cualquier estado activo antes de
`entregado`). Se aprobó la más flexible: se puede cancelar desde
`pendiente`, `asignado`, `recogido` o `en_ruta`. Los estados terminales
(`entregado`, `cancelado`, `rechazado`, `devuelto`, `cliente_ausente`,
`reprogramado`) quedan excluidos — intentarlo devuelve 409. La lista de
estados cancelables vive como constante en `flujo-pedido.service.ts`.

**CU20 — ¿cómo se calcula "productividad del motorizado"?** No hay
fórmula definida y los otros 3 datos del reporte ya son conteos directos.
Se presentaron 3 alternativas (tasa de entregas exitosas; tiempo promedio
de entrega vía `historial_pedido`; ambas combinadas). Se aprobó la más
simple: **productividad = (entregas / pedidos atendidos) × 100**,
redondeada a 2 decimales, 0 si no tiene pedidos atendidos. No requiere
consultas adicionales a las ya necesarias para los otros 3 conteos.

### CU04 — Cancelar Pedido

Endpoint independiente `POST /pedidos/:id/cancelar` dentro de
`FlujoPedidoController` (mismo controlador que el resto del flujo, mismo
prefijo `pedidos`). `CancelarPedidoDto` solo pide `usuarioId` (quien
cancela, administrador — mismo patrón que Asignar/Reasignar Motorizado,
ya que no hay auth/sesión de la que inferirlo).

`FlujoPedidoService.cancelarPedido`: valida que el pedido exista (404) y
que el usuario exista (404); valida que `pedido.estado` esté en la lista
de estados cancelables (409 con el estado actual en el mensaje si no).
Como `Pedido` no tiene `deletedAt` (eliminación física, decidido en Fase
7), la validación "no eliminado" queda cubierta por la propia existencia
del registro. `FlujoPedidoRepository.cancelarPedido` ejecuta en una única
`prisma.$transaction`: actualiza `pedidos.estado = cancelado` y crea el
evento `historial_pedido` (`tipo_evento = cambio_estado`,
`estado = cancelado`, `usuario_id` del administrador).

### Módulo nuevo: `reportes` (CU18, CU19, CU20)

Módulo de solo lectura: únicamente controladores `GET`, sin crear,
actualizar ni eliminar. Repositorio propio (`IReportesRepository` +
`REPORTES_REPOSITORY`) que consulta Prisma directamente con `select`
explícito (no reutiliza `PedidosMapper`/`PedidosService`, ya que el
reporte necesita campos de `sucursal`/`tienda` que el CRUD de Pedidos no
expone) — no importa otros módulos, solo `PrismaService`.

- **`GET /reportes/pedidos`** (CU18): filtros combinables por
  `fechaDesde`/`fechaHasta` (sobre `creadoEn`), `tiendaId` (filtro por
  relación anidada `sucursal.tiendaId`, ya que `Pedido` no tiene
  `tiendaId` directo), `estado` y `motorizadoId`. Paginado.
- **`GET /reportes/entregas`** (CU19): por defecto trae pedidos en los 4
  estados finales (`entregado`, `cancelado`, `devuelto`,
  `reprogramado`); el filtro opcional `estado` debe ser uno de esos 4 o
  responde 400. Filtro de fecha igual que CU18. Paginado.
- **`GET /reportes/motorizados`** (CU20): por motorizado muestra
  `pedidosAtendidos`, `entregas`, `incidentes` y `productividad`.
  Filtros: `motorizadoId` y rango de fechas (acota `pedidosAtendidos` y
  `entregas` por `creadoEn`; no acota `incidentes`, ver limitación de
  modelo abajo). Paginado igual que el resto de listados del proyecto.

**Definición de "pedidos atendidos" y optimización de consultas:**
`pedidosAtendidos`/`entregas` se calculan sobre
`Pedido.motorizadoActualId` (única relación directa entre `Pedido` y
`PerfilMotorizado` en el modelo actual) agrupando con `prisma.groupBy`
sobre los IDs de motorizados de la página actual; `incidentes` se agrupa
igual sobre `Incidente.motorizadoId`. Son **3 consultas agregadas en
total por página**, sin importar cuántos motorizados tenga esa página
(sin N+1). `productividad` se calcula en `ReportesMapper` a partir de
esos conteos, sin consultas adicionales.

### Observación de limitación de modelo (sin modificar el schema)

`Incidente` no tiene columna de fecha de creación (`schema.prisma`,
Fase 2/9). Por eso el filtro de fecha de `GET /reportes/motorizados` no
puede acotar el conteo de incidentes — se cuentan todos los incidentes
históricos del motorizado sin importar el rango pedido. Verificado con
prueba explícita (ver "Pruebas realizadas"). No se modificó el modelo;
si se requiere acotar incidentes por fecha, sería necesario agregar
`createdAt` a `Incidente` — mejora de arquitectura pendiente de
aprobación.

También, dado que `motorizadoActualId` se sobrescribe en cada
reasignación (Fase 9) y el evento de asignación inicial no guarda
`motorizadoId` en `historial_pedido` (solo el de reasignación lo hace),
"pedidos atendidos" refleja el motorizado **actualmente** asignado a
cada pedido, no el historial completo de motorizados que pudo tener un
pedido reasignado. Es la única definición reconstruible con el modelo
actual; se documenta como limitación conocida, no como bug.

### Transacciones

Solo `cancelarPedido` usa `prisma.$transaction` (escribe `pedidos` +
`historial_pedido`). Los 3 endpoints de `reportes` son de solo lectura y,
tal como pedía el alcance de la fase, no usan transacciones.

### Pruebas realizadas

Datos de prueba: 3 usuarios, 2 perfiles de motorizado, 2 tiendas, 2
sucursales (una por tienda), 1 cliente, 6 pedidos.

**Cancelar Pedido:** correcto desde `pendiente` (201), desde `asignado`
(201), desde `recogido` (201, tras Confirmar Recojo), desde `en_ruta`
(201, tras Confirmar Recojo + Iniciar Ruta) — verificado en los 4 casos
que `historial_pedido` tiene el evento `cambio_estado`/`cancelado` con el
`usuario_id` correcto; pedido inexistente (404); usuario inexistente
(404); reintentar sobre un pedido ya `entregado` (409); reintentar sobre
un pedido ya `rechazado` (409).

**Reporte de Pedidos:** filtro por `tiendaId` solo, por `estado` solo,
por `motorizadoId` solo, combinación `tiendaId`+`estado`,
combinación `motorizadoId`+`estado`+rango de fechas, sin filtros, y
paginación (`limit`/`page`) — todos devolvieron los subconjuntos
esperados y el `total` correcto.

**Reporte de Entregas:** sin filtro (trae los 4 estados finales, no el
`rechazado`), filtro por cada uno de los 4 estados válidos, estado
inválido (`asignado` → 400 con el mensaje de los 4 estados permitidos),
rango de fechas futuro que excluye todos los resultados (`total: 0`).

**Reporte de Motorizados:** verificado el cálculo manual contra los
datos de prueba para los 2 motorizados (2 atendidos/1 entrega/0
incidentes/productividad 50 el primero; 3 atendidos/0 entregas/1
incidente/productividad 0 el segundo); filtro por `motorizadoId`;
paginación (`limit=1`, páginas 1 y 2); motorizado inexistente (200,
`data: []`); filtro de fecha futura confirmando la limitación de modelo
documentada (pedidos atendidos y entregas en 0, pero el incidente se
sigue contando).

`prisma validate` ✓ · `prisma generate` ✓ · `tsc --noEmit` ✓ ·
`npm run build` ✓ · `npm run lint` ✓ · suite de tests por defecto
(unit + e2e) sigue pasando. Regresión rápida sobre endpoints de fases
anteriores (listar Pedidos, listar Incidentes, Historial y Fotos de un
pedido) sin cambios de comportamiento. Documentación Swagger verificada
(`/api/docs-json`): tag `Reportes` y las 3 rutas de reportes presentes,
además de `POST /pedidos/{id}/cancelar`. Datos de prueba eliminados de la
base de datos al finalizar.

### Estado actual del desarrollo

Con esta fase queda implementada **toda la lógica funcional de negocio**
definida hasta el momento: flujo completo del pedido (incluyendo
cancelación) y los 3 reportes. Todos los módulos anteriores permanecen
intactos. Sigue sin implementarse JWT/guards (diferido desde el inicio
del proyecto, no forma parte de ningún CU funcional).

### Cobertura funcional alcanzada

CU01–CU20 implementados, con la salvedad de CU07 (Ver Pedidos Asignados)
que sigue sin un filtro directo por motorizado en el listado de Pedidos
(mencionado como observación desde la Fase 9; los reportes de esta fase
sí soportan ese filtro para su propio propósito). No quedan casos de uso
funcionales pendientes de la documentación provista.

### Observaciones para las siguientes fases

- **Incidente sin fecha de creación**: si se necesita acotar reportes de
  incidentes por rango de fechas, se requeriría agregar `createdAt` a
  `Incidente` — mejora de modelo pendiente de aprobación (no aplicada).
- **CU07 "Ver Pedidos Asignados"**: sigue pendiente como filtro directo
  en `ListPedidosQueryDto` del CRUD de Pedidos (observación repetida de
  la Fase 9, no resuelta en esta fase por no ser parte del alcance
  explícito).
- Con JWT/guards fuera de alcance, todos los endpoints de esta fase
  siguen recibiendo `usuarioId`/`motorizadoId` explícitos en el body o
  como filtro, igual que el resto del proyecto.

## Fase 11 — Refactorización, Optimización y Auditoría del Backend

**Fecha:** 2026-07-13

### Alcance de esta fase

Auditoría completa del backend sin agregar casos de uso, sin cambiar
comportamiento funcional, sin JWT/guards/roles y sin tocar el schema de
Prisma. Se revisó arquitectura, organización, dependencias,
repositorios, servicios, DTOs, controllers, Prisma, configuración,
manejo de errores, Clean Code (duplicación, métodos largos,
responsabilidades mezcladas, imports innecesarios, código muerto,
nombres, SOLID/DRY/KISS), consultas Prisma (N+1, selects, transacciones,
índices), validaciones, documentación Swagger y rendimiento.

### Metodología

Se auditaron los 11 módulos de negocio completos, `src/common/`,
`src/config/`, `src/prisma/`, `src/app.module.ts`, `src/main.ts` y
`prisma/schema.prisma`, archivo por archivo (no por muestreo). Se
verificó adicionalmente con `tsc --noEmit --noUnusedLocals
--noUnusedParameters` (0 diagnósticos) y con búsqueda de
`TODO|FIXME|HACK` y código comentado (0 coincidencias).

### Problemas encontrados y corregidos (sin cambio de comportamiento funcional)

1. **Duplicación del patrón "buscar por id o lanzar 404"**: 7 métodos
   privados `obtenerXOFallar` casi idénticos en
   usuarios/tiendas/sucursales/clientes/perfiles-motorizados/pedidos/incidentes.
   Extraído a `src/common/utils/assert-found.util.ts`
   (`assertFound<T>(entity, message)`), reutilizado en los 7 servicios.
   Los mensajes de error por entidad se mantienen exactamente iguales.
2. **Duplicación del manejo de errores de Prisma**: 4 implementaciones
   distintas de "detectar P2002/P2003 y lanzar ConflictException".
   Extraído a `src/common/utils/prisma-error.util.ts`
   (`isUniqueConstraintViolation`, `isForeignKeyViolation`), reutilizado
   en usuarios/tiendas/perfiles-motorizados/pedidos. Mismos códigos y
   mensajes de excepción que antes.
3. **Duplicación del cálculo de paginación**: `(query.page - 1) *
query.limit` repetido literalmente en 10 servicios. Se agregó un
   getter `skip` a `PaginationQueryDto` (`src/common/dto/pagination-query.dto.ts`)
   y se reemplazó en los 10 puntos de uso. Resultado idéntico (mismo
   `skip`/`take` enviado a cada repositorio).
4. **Duplicación mayor: 8 métodos de `flujo-pedido.repository.ts`** (los
   8 casos de uso del flujo del pedido) repetían el mismo bloque de
   escritura a `historial_pedido` dentro de su `$transaction`. Se
   extrajo un método privado `crearEventoHistorial(tx, data)` reutilizado
   por los 8 métodos, sin alterar los campos escritos en cada caso.
5. **Insert de fotos uno por uno**: `confirmarEntrega` insertaba cada
   foto de entrega con un `create` dentro de un `for`. Cambiado a un
   único `fotoEntrega.createMany(...)` (mismo resultado, misma
   transacción, una sola sentencia SQL en vez de N).
6. **Round-trip redundante a la base de datos en `AuthService.login`**:
   después de verificar la contraseña sobre la entidad ya obtenida
   (`entidad`), se volvía a buscar el mismo usuario por id solo para
   construir la respuesta. Se reemplazó por
   `UsuariosMapper.toResponseDto(entidad)` directamente — mismo DTO de
   salida, una consulta menos por login.
7. **Documentación Swagger incompleta**:
   - `PaginatedResponseDto.data` no tenía `@ApiProperty` (afectaba el
     esquema de _todos_ los endpoints paginados). Agregado.
   - Ningún endpoint documentaba el `400` que puede producir el
     `ValidationPipe` global (`whitelist: true, forbidNonWhitelisted:
true`) ni el que produce `ParseIntPipe` sobre un `:id` no numérico.
     Se agregó `@ApiResponse({status: 400, ...})` a los ~52 endpoints
     afectados (todos los que reciben `@Body()`, `@Query()` o
     `@Param('id', ParseIntPipe)`), en los 12 controllers.
   - `GET /` (scaffold de Nest) no tenía tag ni documentación. Se le
     agregó `@ApiTags('Health')` + `@ApiOperation`/`@ApiResponse` y el
     tag correspondiente en `main.ts` (el endpoint en sí no cambió: sigue
     devolviendo `"Hello World!"`, solo se documentó).
8. **Comentario de diseño inconsistente**: `tiendas.repository.ts`
   documenta por qué `buscarPorNombre`/`buscarPorRuc` ignoran
   `deletedAt` a propósito; `usuarios.repository.ts` tiene el mismo
   diseño en `buscarPorUsuario`/`buscarPorCorreo` pero sin comentario.
   Se agregó el comentario equivalente.

Todos los cambios anteriores son refactors o documentación pura:
mismos endpoints, mismos códigos HTTP, mismos mensajes de error, mismos
datos devueltos — verificado con la regresión completa (ver más abajo).

### Problemas encontrados y NO corregidos (requieren aprobación — no se tocó nada)

- **Bug real en el filtro `resuelto` de Incidentes**
  (`src/modules/incidentes/dto/list-incidentes-query.dto.ts`): usa
  `@Type(() => Boolean)`, y `class-transformer` hace `Boolean(valor)`,
  por lo que `?resuelto=false` (string `"false"`) se convierte en `true`
  de JavaScript. El filtro para excluir incidentes resueltos está roto
  hoy. **No se corrigió** porque cambiar el resultado de esa consulta es
  un cambio de comportamiento observable, explícitamente fuera de
  alcance de esta fase. Recomendación: reemplazar por
  `@Transform(({value}) => value === 'true')` en una fase dedicada,
  previa aprobación.
- **CORS `origin: '*'` + `credentials: true`** (`main.ts` +
  `configuration.ts`): combinación contradictoria según la
  especificación CORS — con origin comodín, las peticiones con
  credenciales fallan silenciosamente en el navegador si
  `CORS_ORIGIN` no se configura explícitamente. No se modificó (cambia
  comportamiento de runtime). Recomendación: definir un `CORS_ORIGIN`
  concreto por ambiente, o no usar `credentials: true` mientras el
  origen sea comodín.
- **`reasignarMotorizado` no valida el estado del pedido** (a diferencia
  de sus 5 métodos hermanos en `flujo-pedido.service.ts`, que sí llaman
  `verificarEstado`): hoy se puede reasignar motorizado aunque el pedido
  ya esté en un estado terminal, siempre que `motorizadoActualId`
  coincida. Es una inconsistencia real frente al resto del módulo, pero
  agregar la validación cambiaría qué pedidos aceptan reasignación
  (podría romper flujos actualmente permitidos). No definido en la
  documentación funcional de la Fase 9. Requiere decisión funcional, no
  un fix de auditoría.
- **Validaciones/paralelización de lecturas independientes**
  (`pedidos.service.crear`, y varios métodos de
  `flujo-pedido.service.ts`) hacen 2-3 `await` secuenciales a servicios
  independientes (ej. sucursal, cliente, usuario) en vez de
  `Promise.all`. Es una oportunidad de rendimiento real, pero
  paralelizar cambia el orden en que se evalúan los `NotFoundException`
  cuando _más de una_ referencia es inválida a la vez (hoy es
  determinístico por orden de código; en paralelo pasa a depender de
  qué promesa resuelve primero). Se documenta como recomendación de
  rendimiento, no se aplica, porque altera un comportamiento observable
  en un caso límite.
- **Falta de columna de fecha en `Incidente`**: ya documentado en la
  Fase 10 (impide acotar el reporte de motorizados por fecha en el
  conteo de incidentes). Sigue pendiente de aprobación, no se tocó el
  modelo.
- **Sin esquema Swagger completo para el genérico `PaginatedResponseDto<T>`**:
  se agregó `@ApiProperty({isArray: true})` a `data` (mejor que nada),
  pero el tipo real de cada item (`T`) no se refleja en el schema sin
  agregar `@ApiExtraModels` + `getSchemaPath` en cada uno de los ~12
  controllers con listados — se documenta como mejora pendiente de
  aprobación por el volumen de cambio que implica (no es un cambio de
  comportamiento, pero sí un cambio de alcance mayor al de esta
  auditoría).

### Revisión de arquitectura (sin cambios, solo verificación)

- **Grafo de dependencias entre módulos**: DAG estricto, sin ciclos.
  `usuarios`(sin deps) → `auth`, `perfiles-motorizados`; `tiendas`(sin
  deps) → `sucursales`; `clientes`(sin deps); `pedidos`(sucursales,
  clientes, usuarios) → `historial-pedido`, `fotos-entrega`,
  `flujo-pedido`(+ perfiles-motorizados, usuarios), `incidentes`(+
  perfiles-motorizados); `reportes`(sin deps, solo Prisma directo).
- **Repositorios**: los 12 repositorios usan `PrismaService` de forma
  consistente y ninguno hace lógica de negocio.
- **Mappers**: conversión `BigInt → string` y `Decimal → string`
  consistente en todos los mappers (ninguno se serializa directo, todos
  pasan por `.toString()`).
- **DTOs**: uso consistente de `@IsOptional()` en campos opcionales, de
  `PaginationQueryDto` como base de todo listado, y del trío
  `@Type(() => Number) @IsInt() @Min(1)` para filtros por id.
- **Servicios inyectando servicios concretos de otros módulos** (en vez
  de interfaces): patrón consistente en todo el proyecto para
  composición intra-dominio (ej. `SucursalesService` depende de
  `TiendasService`). Es una decisión arquitectónica de bajo riesgo ya
  asumida desde la Fase 4, no una violación — se revisó explícitamente
  porque el checklist de esta fase lo pedía.

### Rendimiento y consultas Prisma

- `reportes.repository.ts` (Fase 10) ya evita N+1 vía `groupBy` +
  `Promise.all` (3 consultas agregadas sin importar cuántos motorizados
  tenga la página) — verificado, sin cambios.
- `confirmarEntrega` ahora usa `fotoEntrega.createMany` en vez de N
  `create` (ver correcciones aplicadas).
- Ninguna consulta usa `include`/`select` de más: cada repositorio trae
  solo lo que su mapper consume.
- Índices existentes (`@@index([estado])`, `@@index([creadoEn])` en
  Pedido; `@@index([pedidoId, createdAt])` en HistorialPedido;
  `@@index([pedidoId, tipo])` en FotoEntrega; `@@index([motorizadoId,
resuelto])` en Incidente; `@@index([estado])` en PerfilMotorizado)
  cubren los filtros realmente usados en los `where` de cada módulo. No
  se detectaron filtros frecuentes sin índice de soporte.

### Pruebas realizadas

`prisma validate` ✓ · `prisma generate` ✓ · `tsc --noEmit` ✓ ·
`npm run build` ✓ · `npm run lint` ✓ · `npm test` (unit) ✓ · `npm run
test:e2e` ✓.

Regresión completa contra MySQL real cubriendo endpoints de **todas**
las fases anteriores: health root; Auth (register/login correcto e
incorrecto, verificando puntualmente que el fix del round-trip
redundante sigue devolviendo los mismos datos); Usuarios (crear,
duplicado 409, validación 400, id inválido 400 vía ParseIntPipe,
listar); Tiendas/Sucursales/Clientes/Perfiles de Motorizados (crear,
conflictos 404/409); ciclo completo de un pedido
Asignar→Confirmar Recojo→Iniciar Ruta→Confirmar Entrega con 3 fotos
(verificando puntualmente el `createMany` y el helper de historial
compartido, comparando historial y fotos resultantes contra lo
esperado); Reasignar Motorizado + Cancelar Pedido (verificando que el
409 al reintentar sobre un pedido ya cancelado sigue igual); Incidentes;
los 3 reportes (incluyendo el 400 por estado inválido en Reporte de
Entregas). Documentación Swagger regenerada y verificada
(`/api/docs-json`): 13 tags (incluye el nuevo `Health`), 52 respuestas
`400` documentadas. Datos de prueba eliminados de la base de datos al
finalizar.

### Estado actual del desarrollo

Todo el comportamiento funcional de las Fases 1–10 permanece intacto y
verificado por regresión. El código es más DRY (duplicación real
reducida en 6 puntos concretos), la documentación Swagger está
completa para los códigos de error 400/404/409, y `confirmarEntrega`
hace una escritura SQL en vez de N para las fotos. No se agregó ningún
caso de uso, no se tocó el schema de Prisma, no se implementó
JWT/guards/roles.

### Deuda técnica identificada (pendiente de aprobación explícita)

1. Bug del filtro `resuelto` en Incidentes (ver arriba) — el de mayor
   severidad real, aunque no afecta ningún flujo probado en fases
   anteriores porque nunca se probó `resuelto=false` explícitamente.
2. Configuración CORS contradictoria (`origin: '*'` + `credentials:
true`).
3. `reasignarMotorizado` sin validación de estado del pedido
   (inconsistente con sus 5 métodos hermanos).
4. Paralelización pendiente de validaciones independientes en
   `pedidos.service.crear` y varios métodos de `flujo-pedido.service.ts`
   (mejora de rendimiento, no de corrección).
5. `Incidente` sin columna de fecha (arrastrada desde la Fase 10).
6. Esquema Swagger genérico de `PaginatedResponseDto<T>` no refleja el
   tipo real de cada item sin `@ApiExtraModels` por controller.
7. JWT/autenticación por token, guards y roles siguen sin implementarse
   (diferido desde el inicio del proyecto, no es deuda nueva).

## Fase 12 — Cierre Definitivo del Backend

**Fecha:** 2026-07-13

### Alcance de esta fase

Fase de cierre: **no** se repitió la auditoría de la Fase 11. Se
trabajó exclusivamente sobre 2 de los 6 hallazgos documentados como
"pendientes de aprobación" en esa fase (los 2 que el cliente aprobó
corregir: el bug de `resuelto` y la configuración de CORS), más la
revisión puntual de `reasignarMotorizado` que quedó pendiente de
decisión. No se tocó el modelo de datos, no se agregaron endpoints,
DTOs, servicios ni módulos nuevos, no se implementó JWT/guards/roles.

### Corrección 1 — Filtro `resuelto` de Incidentes

**Causa raíz real (más profunda de lo documentado en la Fase 11):** no
bastaba con reemplazar `@Type(() => Boolean)` por un `@Transform`
manual. El `ValidationPipe` global usa `enableImplicitConversion: true`
(`main.ts`), y `class-transformer`, al no encontrar un `@Type()`
explícito, igual detecta vía `reflect-metadata` que la propiedad es de
tipo `boolean` y aplica su propia conversión `Boolean(valor)` **antes**
de ejecutar cualquier `@Transform` — pisando su resultado. Se comprobó
esto de forma aislada (`plainToInstance` directo) antes de corregir:
tanto `"true"` como `"false"` colapsaban al mismo valor final.

**Solución aplicada**
(`src/modules/incidentes/dto/list-incidentes-query.dto.ts`):
`@Type(() => String)` antes del `@Transform`. Como el valor real que
llega desde el query siempre es un string, `String(valor)` es una
transformación identidad — evita que `class-transformer` dispare su
conversión implícita a `Boolean`, y deja que el `@Transform` reciba el
string original sin tocar. El `@Transform` reconoce `'true'/'1'` →
`true`, `'false'/'0'` → `false`, y cualquier otro valor lo deja intacto
para que `@IsBoolean()` lo rechace con 400 (mensaje explícito:
"resuelto debe ser un valor booleano (true, false, 1 o 0)").

Verificado end-to-end contra MySQL real con un incidente `resuelto:
false` conocido: `resuelto=false` y `resuelto=0` lo devuelven;
`resuelto=true` y `resuelto=1` devuelven vacío; `resuelto=maybe` → 400
con el mensaje esperado; sin el filtro, se sigue listando igual que
antes. No se modificó ninguna otra validación del proyecto.

### Corrección 2 — Configuración de CORS

**Antes:** `corsOrigin: process.env.CORS_ORIGIN ?? '*'` (con default
`'*'` tanto en `configuration.ts` como en `env.validation.ts`) combinado
con `credentials: true` en `main.ts` — combinación inválida según la
especificación CORS si la variable de entorno no se configura.

**Después:**

- `CORS_ORIGIN` pasa a ser **obligatoria** en `env.validation.ts`
  (`@IsNotEmpty()`, sin valor por defecto), exactamente el mismo patrón
  ya usado para `DATABASE_URL` desde la Fase 1 — la aplicación no
  levanta si falta, en vez de caer silenciosamente a un comodín
  inseguro.
- `configuration.ts` ahora parsea `CORS_ORIGIN` como una **lista
  separada por comas** (`corsOrigin: string[]`), permitiendo declarar
  varios orígenes (ej. distintos frontends de desarrollo/staging/
  producción) sin escribir ningún origen en el código — ambos quedan
  únicamente en `.env`/`.env.example`.
- `main.ts` no se modificó: `app.enableCors({ origin: corsOrigin,
credentials: true })` ya funcionaba igual pasándole un array de
  orígenes (soportado nativamente por el paquete `cors`).
- `.env` y `.env.example` actualizados solo con un comentario
  explicando el formato (lista separada por comas) y un ejemplo con
  múltiples orígenes para producción; el valor real de desarrollo
  (`http://localhost:5173`, ya presente desde antes, anticipando el
  frontend) no cambió.

Verificado: petición preflight con `Origin: http://localhost:5173`
responde `Access-Control-Allow-Origin: http://localhost:5173` (origen
reflejado, no `*`); la misma petición con un origen no listado no
recibe cabecera `Access-Control-Allow-Origin` (seria bloqueada por el
navegador). Verificado también, de forma aislada (sin tocar el `.env`
real), que `env.validation.ts` rechaza `CORS_ORIGIN` vacío con un
error claro al arrancar.

### Revisión de `reasignarMotorizado` — sin cambios

Se revisó exclusivamente si existía alguna regla funcional documentada
que restrinja desde qué estados de `Pedido` se permite reasignar
motorizado. No se dispone, en ningún mensaje de fase de este proyecto,
de una regla que lo defina — solo se especificó (Fase 9) que debe
coincidir el motorizado anterior. Siguiendo la regla general del
proyecto ("nunca inventar reglas de negocio"), **se mantiene
exactamente el comportamiento actual**: `reasignarMotorizado` no valida
`estado`, solo que `motorizadoActualId` coincida con
`motorizadoAnteriorId`. Verificado explícitamente contra MySQL real que
sigue permitiendo reasignar sobre un pedido ya `cancelado` (mismo
comportamiento que antes de esta fase). La inconsistencia frente a sus
5 métodos hermanos (que sí validan estado) permanece documentada como
observación abierta; no se resuelve sin una definición explícita de la
documentación funcional o una decisión del cliente.

### Optimizaciones descartadas explícitamente

Ninguna de las oportunidades de rendimiento documentadas en la Fase 11
(paralelizar validaciones independientes con `Promise.all` en
`pedidos.service.crear` y en varios métodos de
`flujo-pedido.service.ts`) se implementó en esta fase, por instrucción
explícita: cambiaría el orden en que se evalúan las validaciones y, por
lo tanto, cuál error se reporta primero cuando más de una referencia es
inválida a la vez. Se mantiene el comportamiento secuencial exacto.

### Modelo de datos

No se tocó `schema.prisma`, migraciones, índices ni relaciones. La
observación pendiente sobre `Incidente` sin columna de fecha (Fase 10)
sigue abierta, solo documentada.

### Calidad de código

Durante estas correcciones no quedaron imports ni variables sin uso
(verificado con `tsc --noEmit --noUnusedLocals --noUnusedParameters`,
0 diagnósticos) ni comentarios obsoletos generados por esta fase. No se
realizó ninguna refactorización general, reorganización de módulos ni
movimiento de archivos fuera de los 4 archivos tocados.

### Swagger

Se revisó únicamente la documentación del campo `resuelto` afectado por
la Corrección 1 (su `@ApiPropertyOptional` ya refleja "acepta true/false
o 1/0", agregado en la propia corrección). Ningún endpoint, request ni
response cambió; no se tocó el resto de la documentación Swagger.

### Archivos modificados en esta fase

- `src/modules/incidentes/dto/list-incidentes-query.dto.ts` (Corrección 1)
- `src/config/configuration.ts` (Corrección 2)
- `src/config/env.validation.ts` (Corrección 2)
- `.env`, `.env.example` (comentarios de formato, Corrección 2)

Ningún otro archivo del proyecto fue modificado. `ARCHITECTURE.md` y
`API_OVERVIEW.md` no se actualizaron: ninguna corrección cambió la
arquitectura, los módulos, los endpoints ni las respuestas documentadas
en esos archivos.

### Pruebas realizadas

`prisma validate` ✓ (schema sin cambios) · `prisma generate` ✓ ·
`tsc --noEmit` ✓ · `npm run build` ✓ · `npm run lint` ✓ (solo formato
Prettier) · `npm test` (unit) ✓ · `npm run test:e2e` ✓.

Regresión completa contra MySQL real cubriendo los módulos
principales: Auth (login, verificando que el fix de la Fase 11 sigue
igual), Usuarios/Tiendas/Sucursales/Clientes/Perfiles de Motorizados
(creación básica), ciclo de Pedido (crear → asignar → cancelar),
Reasignar Motorizado sobre un pedido ya cancelado (comportamiento sin
cambios, verificado explícitamente), e Incidentes con los 5 casos del
filtro `resuelto` (false/true/1/0/inválido) contra un incidente real en
base de datos. Verificación adicional de CORS con peticiones preflight
reales (origen permitido vs. no permitido) y de la validación de
arranque de `CORS_ORIGIN` de forma aislada. Datos de prueba eliminados
de la base de datos al finalizar; servidor de pruebas detenido.

### Observaciones nuevas detectadas durante esta fase (solo documentadas, sin actuar)

- La causa raíz real del bug de `resuelto` era más profunda que lo
  documentado en la Fase 11 (interacción entre `enableImplicitConversion`
  del `ValidationPipe` global y la metadata de tipo reflejada por
  TypeScript, no solo el uso de `@Type(() => Boolean)`). Vale la pena
  tenerlo presente para cualquier futuro filtro `boolean` en el
  proyecto: **cualquier DTO que agregue un filtro booleano por query
  debe usar el mismo patrón `@Type(() => String)` + `@Transform`
  manual**, no `@Type(() => Boolean)` a secas, para evitar reintroducir
  el mismo bug.

### Estado final del backend

- **Funcionalmente completo**: sí. Todos los casos de uso documentados
  (CU01–CU20) están implementados y probados; esta fase no agregó ni
  quitó ninguno.
- **Técnicamente estable**: sí. Las 2 correcciones aplicadas son
  acotadas, verificadas de forma aislada y end-to-end, sin efectos
  secundarios detectados en el resto del sistema.
- **Libre de errores de compilación**: sí. `tsc --noEmit`, `build` y
  `lint` limpios; suites unit y e2e pasando.
- **Listo para comenzar el desarrollo del frontend**: sí. La API es
  estable, está documentada (Swagger completo, `ARCHITECTURE.md`,
  `API_OVERVIEW.md`), y el `CORS_ORIGIN` configurado hoy
  (`http://localhost:5173`) ya anticipa un frontend local corriendo en
  Vite.
- **Preparado para una futura implementación de JWT sin
  refactorizaciones importantes**: sí, con matices ya documentados en
  fases previas — todos los endpoints que necesitan "quién realiza la
  acción" ya reciben ese dato explícito en el body (`usuarioId`,
  `motorizadoId`, `creadoPorId`), por lo que introducir JWT
  significaría agregar guards + extraer esos valores del token en vez
  del body, sin cambiar la forma de los servicios/repositorios. Las
  observaciones abiertas (bug histórico ya corregido, `reasignarMotorizado`
  sin validación de estado, paralelización pendiente, `Incidente` sin
  fecha, Swagger genérico de paginación) no bloquean el frontend: son
  mejoras o decisiones de negocio pendientes, no defectos funcionales
  activos conocidos.

**A partir de esta fase, el backend queda en feature freeze**: cualquier
cambio posterior debe responder a un bug crítico descubierto durante el
desarrollo del frontend o a un nuevo requerimiento del cliente, no a
refactorizaciones espontáneas.

## Fase 13 — Corrección de Hallazgos Críticos de Auditoría (proyecto Fase 15)

Excepción explícita al feature freeze de la Fase 12: una auditoría
integral del proyecto completo (proyecto Fase 14, ver
`AUDIT_REPORT.md`/`TECH_DEBT.md` en la raíz del repositorio) encontró
dos bugs críticos reales en el backend. Esta fase corrige exclusivamente
esos dos hallazgos — ninguna funcionalidad nueva, ningún DTO público
modificado, ningún cambio de esquema de base de datos.

### C1 — Condición de carrera en `flujo-pedido`

**Diagnóstico confirmado**: las 8 transiciones de estado (asignar,
reasignar, confirmar-recojo, iniciar-ruta, confirmar-entrega,
cliente-ausente, rechazo, cancelar) validaban la precondición de
negocio (estado esperado, o motorizado actual esperado) _antes_ de
abrir `prisma.$transaction`, y el `tx.pedido.update()` dentro de la
transacción filtraba únicamente por `id` — sin condicionar por esa
misma precondición. Dos solicitudes concurrentes sobre el mismo pedido
podían pasar ambas la validación antes de que cualquiera escribiera,
produciendo transiciones dobles (dos eventos de `historial_pedido`,
fotos duplicadas) sin que el backend devolviera nunca un `409`.

**Corrección aplicada**: se agregó `actualizarPedidoCondicional`,
método privado único en `flujo-pedido.repository.ts`, reutilizado por
los 8 casos de uso (sin duplicar lógica). Ejecuta
`tx.pedido.updateMany({ where: { id, ...precondición }, data })` dentro
de la misma transacción; si `count === 0` (la precondición ya no se
cumple porque otra transacción ganó la carrera), lanza
`ConflictException` — la transacción completa se revierte, sin
escrituras parciales en `historial_pedido` ni `fotos_entrega` — y el
cliente recibe `409 Conflict`. Es concurrencia optimista pura: MySQL ya
bloquea la fila coincidente y reevalúa el `WHERE` contra el valor
comprometido, así que no hizo falta agregar bloqueo explícito
(`SELECT ... FOR UPDATE`) ni una columna de versión.

`ESTADOS_CANCELABLES` (antes definida solo en el service) se movió a
`interfaces/flujo-pedido-repository.interface.ts` — única fuente de
verdad ahora importada tanto por el service (mensaje de error legible
en el chequeo rápido previo) como por el repository (condición atómica
del `updateMany` de `cancelarPedido`), para no mantener la misma lista
de estados en dos archivos.

`reasignarMotorizado` **no** ganó una validación de estado nueva —
sigue exactamente igual que antes (inconsistencia de negocio ya
documentada en la Fase 11/12, dejada abierta a propósito pendiente de
decisión del cliente). Lo único que cambió es que su propia precondición
existente (que el motorizado actual coincida con `motorizadoAnteriorId`)
ahora también se verifica de forma atómica dentro de la transacción, no
solo antes de abrirla — cerrando la misma clase de condición de carrera
para ese caso de uso sin alterar su semántica de negocio.

**Verificado con solicitudes concurrentes reales** contra MySQL: dos
`POST /pedidos/:id/confirmar-recojo` simultáneos sobre el mismo pedido
`asignado` — uno resolvió `201` (`estado: recogido`), el otro `409`
(`"El pedido debe estar en estado 'asignado' para confirmar el recojo
(estado actual: 'recogido')"`); `historial_pedido` y `fotos_entrega`
quedaron con exactamente un registro nuevo cada uno (no dos). Flujo
completo posterior (iniciar-ruta → confirmar-entrega) verificado sin
regresión, terminando en `estado: entregado` con observaciones y foto
correctas. Un intento tardío de `confirmar-recojo` sobre el pedido ya
`entregado` devolvió `409` (nunca `500`).

### C2 — Fuga de información en `HttpExceptionFilter`

**Diagnóstico confirmado**: para cualquier excepción que no fuera una
instancia de `HttpException` (es decir, prácticamente cualquier error
no lanzado deliberadamente por nuestro propio código — errores de
Prisma, de conexión, cualquier `throw` inesperado, dado que casi todo
lo que se lanza en JS/TS es una instancia de `Error`), el filtro caía
en `exception.message` y lo devolvía tal cual en la respuesta HTTP —
contradiciendo lo ya documentado en `ARCHITECTURE.md` ("la respuesta al
cliente nunca incluye detalles internos").

**Corrección aplicada**: `src/common/filters/http-exception.filter.ts`
ahora usa siempre el mensaje genérico fijo `'Error interno del
servidor'` para cualquier excepción que no sea un `HttpException`
propio — sin ninguna rama que exponga `exception.message` en ese caso.
El `stack` completo se sigue logueando únicamente del lado del servidor
(sin cambios ahí). Los mensajes de errores HTTP conocidos y ya
esperados por el frontend (400/401/403/404/409/422, todos lanzados
deliberadamente por nuestro propio código con texto controlado) no
cambiaron en absoluto.

### Verificación de no-regresión

`prisma validate` ✓ · `prisma generate` ✓ · `tsc --noEmit` ✓ ·
`npm run build` ✓ · `npm run lint` ✓ · `npm test` (unit) ✓ ·
`npm run test:e2e` ✓. Contra MySQL real: se confirmó `200`/`201` en
Usuarios, Tiendas, Sucursales, Clientes, Perfiles de Motorizados,
Pedidos, Incidentes, y los 3 endpoints de Reportes; `404` conocido
(`GET /usuarios/999999`) y `400` conocido (`GET /usuarios/abc`) se
comportan exactamente igual que antes de esta fase — la corrección de
`HttpExceptionFilter` solo afecta la rama de error no controlado
(`!isHttpException`), nunca los códigos HTTP ya documentados.

### Archivos modificados

- `src/modules/flujo-pedido/flujo-pedido.repository.ts` (C1)
- `src/modules/flujo-pedido/flujo-pedido.service.ts` (C1 — ajuste menor: importa `ESTADOS_CANCELABLES` desde la interfaz en vez de definirla localmente; pasa `motorizadoAnteriorId` al repository)
- `src/modules/flujo-pedido/interfaces/flujo-pedido-repository.interface.ts` (C1 — `ESTADOS_CANCELABLES` movida aquí; `ReasignarMotorizadoData` gana el campo `motorizadoAnteriorId`)
- `src/common/filters/http-exception.filter.ts` (C2)

Ningún DTO público, ningún endpoint, ningún contrato HTTP externo
cambió. `ReasignarMotorizadoData`/`ESTADOS_CANCELABLES` son tipos
internos del repositorio (nunca expuestos vía HTTP), por lo que este
cambio no rompe compatibilidad con el frontend.

**El backend vuelve a quedar en feature freeze** al cerrar esta fase.

## Fase 14 — Incorporación de `nombres`/`apellidos` al modelo Usuario (proyecto Fase 16)

Excepción explícita al feature freeze de la Fase 12/13: enriquecimiento
puntual y acotado del modelo `Usuario` con dos campos de persona
(`nombres`, `apellidos`), a pedido explícito del cliente. Ninguna otra
tabla, relación, índice ni enum se tocó. El login sigue funcionando
exactamente igual (`identificador` + `password`); no se implementó JWT.

### Modelo Prisma

`Usuario` gana `nombres String @db.VarChar(100)` y
`apellidos String @db.VarChar(100)`, ambos obligatorios, ubicados justo
después de `id` (antes de las columnas de cuenta `usuario`/`correo`/
`passwordHash`). Sin cambios en relaciones, índices ni enums.

### Migración

`20260714161908_add_nombres_apellidos_usuario`. El proyecto solo tenía
datos de prueba (17 filas en `usuarios` al momento de migrar) — se usó
un `DEFAULT 'Pendiente'` temporal únicamente para poder aplicar la
restricción `NOT NULL` sobre las filas existentes (backfill), eliminado
en la misma migración (`ALTER COLUMN ... DROP DEFAULT`) para que el
estado final de ambas columnas coincida exactamente con `schema.prisma`
(sin `@default`): cualquier fila nueva debe proveer estos campos
explícitamente. No se intentó reconstruir nombres reales para las filas
de prueba existentes — decisión explícita del cliente para esta fase
("no es necesario preservar registros antiguos").

### Backend — capas actualizadas

- `CreateUsuarioDto` — `nombres`/`apellidos` obligatorios
  (`@IsString @IsNotEmpty @MaxLength(100)`), agregados antes de
  `usuario` para reflejar que identifican a la persona antes que a la
  cuenta.
- `UsuarioResponseDto` — `nombres`/`apellidos` agregados.
- `UsuariosMapper.toResponseDto` — mapea los dos campos nuevos.
- `UsuariosService.crear`/`actualizar` — pasa `nombres`/`apellidos` al
  repositorio (en `actualizar`, con el mismo patrón condicional ya usado
  para `usuario`/`correo`/`rol`: solo se incluye si vino en el DTO).
- `CrearUsuarioData`/`ActualizarUsuarioData`
  (`usuarios-repository.interface.ts`) — agregan los dos campos.
- **Sin cambios necesarios** en: `UpdateUsuarioDto` (`PartialType(CreateUsuarioDto)`
  ya vuelve `nombres`/`apellidos` opcionales automáticamente),
  `RegisterDto` (`OmitType(CreateUsuarioDto, ['rol'])` ya hereda los
  campos nuevos), `AuthResponseDto`/`AuthService`/`AuthController`
  (envuelven `UsuarioResponseDto` tal cual), `UsuariosController`,
  `UsuariosRepository` (ya hace spread genérico de `data` hacia Prisma).
  Esto confirma que el diseño de DTOs por composición (`PartialType`/
  `OmitType`) de las fases anteriores paga dividendos reales: un campo
  nuevo en el DTO base se propaga solo, sin tocar los DTOs derivados.

### Pruebas funcionales realizadas (contra MySQL real)

- `POST /usuarios` con `nombres`/`apellidos` → `201`, campos presentes
  en la respuesta.
- `POST /usuarios` sin `nombres` → `400` con los 3 mensajes de
  validación esperados (`IsString`/`IsNotEmpty`/`MaxLength`).
- `POST /auth/register` (autorregistro motorizado) con
  `nombres`/`apellidos` → `201`, campos presentes.
- `POST /auth/login` con una cuenta ya existente → `200`, respuesta
  incluye `nombres`/`apellidos` (verificado con una cuenta de prueba
  pre-existente, backfileada con `'Pendiente'/'Pendiente'` por la
  migración, y con una cuenta nueva creada en esta misma verificación).
- `PATCH /usuarios/:id` actualizando solo `apellidos` → confirmado que
  `nombres` no se pisa (mismo patrón condicional que el resto de
  campos).
- Regresión: `GET /reportes/pedidos|entregas|motorizados`,
  `GET /perfiles-motorizados` → `200` sin cambios, `prisma validate` ✓,
  `tsc --noEmit` ✓, `npm run build` ✓, `npm run lint` ✓, `npm test`
  (unit) ✓, `npm run test:e2e` ✓.
- Los 2 usuarios de prueba creados durante esta verificación se
  eliminaron lógicamente al finalizar (mismo mecanismo de `DELETE
/usuarios/:id` de siempre).

### Archivos modificados

- `prisma/schema.prisma`
- `prisma/migrations/20260714161908_add_nombres_apellidos_usuario/migration.sql` (nuevo)
- `src/modules/usuarios/dto/create-usuario.dto.ts`
- `src/modules/usuarios/dto/usuario-response.dto.ts`
- `src/modules/usuarios/usuarios.mapper.ts`
- `src/modules/usuarios/usuarios.service.ts`
- `src/modules/usuarios/interfaces/usuarios-repository.interface.ts`

Ningún otro módulo, tabla, relación ni endpoint fue modificado.
`API_OVERVIEW.md` actualizado (menciones puntuales de `nombres`/
`apellidos` en Usuarios/Auth). `ARCHITECTURE.md` no requirió cambios:
ninguna decisión arquitectónica permanente cambió, solo se enriqueció
un modelo existente siguiendo exactamente los patrones ya establecidos.

**El backend vuelve a quedar en feature freeze** al cerrar esta fase.

## Fase 15 — Representación Unificada del Motorizado (proyecto Fase 17)

Excepción explícita al feature freeze: ningún endpoint que devolviera
información de un motorizado incluía su nombre — varios exponían
únicamente `placa` (o, en el caso de Incidentes/Historial, ni siquiera
eso: solo el id crudo). Esta fase extiende únicamente los dos
contratos donde realmente hacía falta, sin tocar lógica de negocio, ids,
relaciones de base de datos ni ningún otro DTO.

### Consultas Prisma actualizadas

- `PerfilesMotorizadosRepository` — las 6 operaciones (`crear`,
  `buscarPorId`, `buscarPorUsuarioId`, `buscarMuchos`, `actualizar`,
  `eliminar`) ahora usan `include: { usuario: { select: { nombres: true,
apellidos: true } } }` (constante `INCLUDE_USUARIO` única, reutilizada
  por las 6 — sin duplicar el include). Un solo query por operación, sin
  N+1.
- `ReportesRepository.reporteMotorizados` — el `select` del
  `perfilMotorizado.findMany` agrega
  `usuario: { select: { nombres: true, apellidos: true } } }`.
  `reportePedidos`/`reporteEntregas` **no** se tocaron: ya devolvían
  únicamente `motorizadoActualId` (ni siquiera `placa`), y el frontend
  ya resuelve la representación completa cruzando ese id contra
  `GET /perfiles-motorizados` (ahora enriquecido) — agregar
  `nombres`/`apellidos`/`placa` a cada fila de esos dos reportes hubiera
  sido duplicar datos que el frontend ya puede obtener de forma más
  eficiente con una sola consulta adicional cacheada al montar la página.

### DTOs modificados

- `PerfilMotorizadoResponseDto` — agrega `nombres`, `apellidos`.
- `ReporteMotorizadoItemDto` — agrega `nombres`, `apellidos`.
- **Sin cambios** en: `PedidoResponseDto`, `IncidenteResponseDto`,
  `HistorialPedidoResponseDto`, `ReportePedidoItemDto` — todos siguen
  exponiendo únicamente el id del motorizado (`motorizadoId`/
  `motorizadoActualId`), tal como antes.

### Tipos internos

`IPerfilesMotorizadosRepository` — los 6 métodos cambian su tipo de
retorno de `Promise<PerfilMotorizado>` (tipo crudo de Prisma) a
`Promise<PerfilMotorizadoConUsuario>` (`PerfilMotorizado & { usuario:
{ nombres: string; apellidos: string } }`, definido en el propio archivo
de interfaz). `ReporteMotorizadoRow` gana `nombres`/`apellidos`.
`PerfilesMotorizadosService`/`PerfilesMotorizadosMapper` actualizados
para el nuevo tipo — ningún otro consumidor de
`PerfilesMotorizadosService` (ej. `flujo-pedido.service.ts`, que solo
lee `PerfilMotorizadoResponseDto` ya mapeado) necesitó cambios.

### Pruebas funcionales realizadas (contra MySQL real)

- `GET /perfiles-motorizados` y `GET /perfiles-motorizados/:id` →
  incluyen `nombres`/`apellidos` reales del usuario asociado.
- `GET /reportes/motorizados` → cada fila incluye `nombres`/`apellidos`
  junto a `placa`, `estado` y las métricas ya existentes.
- Verificado extremo a extremo con datos reales: se actualizó el nombre
  de dos usuarios de prueba con perfil de motorizado (`PATCH
/usuarios/:id`) y se confirmó que `GET /perfiles-motorizados` y
  `GET /reportes/motorizados` reflejaron el cambio inmediatamente (ej.
  "Carlos" + "Rojas" + placa `F8-0002`).
- Regresión: `prisma validate` ✓, `prisma generate` ✓,
  `tsc --noEmit` ✓, `npm run build` ✓, `npm run lint` ✓, `npm test`
  (unit) ✓, `npm run test:e2e` ✓.

### Archivos modificados

- `src/modules/perfiles-motorizados/dto/perfil-motorizado-response.dto.ts`
- `src/modules/perfiles-motorizados/interfaces/perfiles-motorizados-repository.interface.ts`
- `src/modules/perfiles-motorizados/perfiles-motorizados.repository.ts`
- `src/modules/perfiles-motorizados/perfiles-motorizados.mapper.ts`
- `src/modules/perfiles-motorizados/perfiles-motorizados.service.ts`
- `src/modules/reportes/dto/reporte-motorizado-item.dto.ts`
- `src/modules/reportes/interfaces/reportes-repository.interface.ts`
- `src/modules/reportes/reportes.repository.ts`
- `src/modules/reportes/reportes.mapper.ts`

Ningún DTO público perdió compatibilidad (solo se agregaron campos);
ningún endpoint, id, relación de base de datos ni regla de negocio
cambió. `API_OVERVIEW.md` actualizado con la mención puntual de los
campos nuevos.

## Fase 16 — Infraestructura de Exportación de Reportes (proyecto Fase 18)

Excepción explícita al feature freeze: se agrega infraestructura de exportación (Excel/PDF/CSV/JSON/XML) para los 3 reportes existentes (CU18/CU19/CU20). Ninguna tabla, relación, DTO de reporte visual, regla de negocio ni endpoint de solo lectura existente se modificó — solo se agregaron 3 endpoints nuevos (`GET /reportes/{pedidos,entregas,motorizados}/export`) y una capa nueva bajo `common/exports/`.

### Diseño

- **Capa agnóstica de reporte** (`common/exports/`): un contrato único (`ExportSolicitud` = título, columnas, filas, filtros, generadoPor, generadoEn) y un `IExportador` por formato. Ningún exportador conoce Pedidos/Entregas/Motorizados — reciben siempre la misma forma de datos, sin importar el reporte de origen. Ver `ARCHITECTURE.md` §7 para el contrato completo.
- **`ExportService`** (`common/exports/export.service.ts`) despacha al exportador correspondiente según `FormatoExportacion`; es la única puerta de entrada a la generación de archivos.
- **`ReportesService` nunca genera el archivo**: sus 3 métodos nuevos (`exportarReportePedidos`/`exportarReporteEntregas`/`exportarReporteMotorizados`) reutilizan **exactamente** el mismo método de repositorio que su reporte visual homónimo (misma consulta Prisma, mismos filtros), recorren todas las páginas con la nueva utilidad `common/utils/fetch-all-pages.util.ts` (mismo patrón que la utilidad equivalente ya existente en el frontend desde la Fase 8 del proyecto), y delegan en `ExportService.exportar(...)`.
- **DTOs de exportación** (`Reporte{Pedidos,Entregas,Motorizados}ExportQueryDto`): cada uno es `OmitType(<QueryDto existente>, ['page', 'limit'])` + `formato`/`generadoPor` — garantiza paridad exacta de filtros con el reporte visual sin duplicar decoradores de validación.
- **`ReportesController`**: 3 endpoints nuevos, cada uno llama al service y delega en un único método privado `enviarArchivo()` que fija `Content-Type`/`Content-Disposition` y devuelve un `StreamableFile` (vía `@Res({ passthrough: true })`, preservando el pipeline de Nest).
- **Columnas expuestas por reporte**: Pedidos/Entregas comparten fila (mismo DTO base) con `Cliente (id)`/`Motorizado (id)` **crudos** (el reporte visual tampoco resuelve esos ids a nombre en el backend — se decidió no agregar joins nuevos solo para exportar, ya que eso violaría "reutilizar la misma consulta, no crear una distinta"); Motorizados expone `nombres`/`apellidos`/`placa` como columnas separadas (nunca concatenadas — la API sigue entregando datos estructurados, la concatenación es responsabilidad exclusiva del frontend, `formatMotorizado`).
- **CORS**: se agregó `exposedHeaders: ['Content-Disposition']` a `app.enableCors(...)` en `main.ts` — sin esto, el navegador oculta ese header a JavaScript aunque viaje en la respuesta, y el frontend no podría leer el nombre de archivo que decide el backend. Única modificación fuera de `reportes`/`common/exports`.

### Librerías nuevas

`exceljs` (Excel), `pdfkit` + `@types/pdfkit` (PDF), `xmlbuilder2` (XML). CSV y JSON se implementaron a mano (sin dependencia nueva): ambos son simples de generar correctamente sin librería (CSV: BOM UTF-8 + separador `,` + escape RFC 4180; JSON: `JSON.stringify` nativo).

### Pruebas funcionales realizadas (contra MySQL real, servidor en modo watch)

- Las 15 combinaciones (3 reportes × 5 formatos) → `200`, `Content-Type` correcto por formato, `Content-Disposition` con nombre de archivo generado (`<slug-del-titulo>_<YYYYMMDD-HHmmss>.<ext>`).
- Contenido verificado por formato: JSON/XML reflejan `filtros` aplicados (ej. `estado=entregado` en Entregas) y `totalRegistros` correcto; CSV con BOM UTF-8 válido (`efbbbf`) y filas escapadas correctamente; XLSX es un ZIP válido (`PK\x03\x04`) y se releyó con `exceljs` confirmando título fusionado, metadata, encabezado y datos; PDF con magic bytes válidos (`%PDF-1.3`); los 3 XML se validaron como bien formados con el parser `[xml]` de PowerShell.
- Casos de error: `formato` inválido → `400` con mensaje de `class-validator`; `generadoPor` faltante → `400`; `estado` inválido en `entregas/export` → `400` reutilizando la misma validación (`validarEstadoReporteEntregas`) que el reporte visual.
- Regresión: `prisma validate` ✓, `prisma generate` ✓, `tsc --noEmit` ✓, `npm run build` ✓, `npm run lint` (eslint + prettier) ✓, `npm test` (unit) ✓, `npm run test:e2e` ✓.

### Archivos modificados/creados

- `common/exports/` (nuevo): `export.types.ts`, `export.service.ts`, `export.module.ts`, `export-filename.util.ts`, `excel/excel.exporter.ts`, `pdf/pdf.exporter.ts`, `csv/csv.exporter.ts`, `json/json.exporter.ts`, `xml/xml.exporter.ts`.
- `common/utils/fetch-all-pages.util.ts` (nuevo).
- `modules/reportes/dto/reporte-{pedidos,entregas,motorizados}-export-query.dto.ts` (nuevos).
- `modules/reportes/reportes.service.ts`, `reportes.controller.ts`, `reportes.module.ts` (extendidos).
- `main.ts` (`exposedHeaders`).
- `package.json` (3 dependencias nuevas + 1 devDependency).

Ningún módulo fuera de `reportes`/`common/exports` ni ninguna tabla/migración se tocó. `API_OVERVIEW.md` y `ARCHITECTURE.md` (§7) actualizados.

**El backend vuelve a quedar en feature freeze** al cerrar esta fase.

## Fase 17 — Centro de Importaciones (proyecto Fase 19)

Excepción explícita al feature freeze: se agrega un módulo nuevo, `importaciones`, único punto de entrada para importación masiva de Clientes, Tiendas y Motorizados (Excel/JSON/XML), con vista previa sin escritura, confirmación transaccional por fila, idempotencia real, detección de duplicados, historial persistido y reporte de errores descargable. Infraestructura preparada para futuras entidades — agregar una implica un nuevo importador, no un módulo nuevo.

### Ambigüedad resuelta con el cliente antes de implementar

La fase pedía detectar duplicados por `documentoIdentidad` (Clientes) y por `placa` (Motorizados), pero ninguno de los dos tenía una regla de unicidad real en el sistema (ni a nivel de base de datos ni de servicio) — solo Tiendas (`nombre`/`ruc`) y Motorizados-por-usuario (`Usuario.usuario`, ya único) tenían una regla ya implementada reutilizable. Se consultó con el cliente entre 3 alternativas (constraint único en BD, verificación de solo lectura sin tocar el esquema, o no deduplicar esos 2 campos) — se eligió agregar constraints únicos reales en BD (`Cliente.documentoIdentidad`, `PerfilMotorizado.placa`), la única opción que garantiza idempotencia real incluso ante 2 importaciones simultáneas del mismo archivo.

### Modelo Prisma

- `Cliente.documentoIdentidad` y `PerfilMotorizado.placa` ganan `@unique`. Ambos son compatibles con el resto del dominio: `documentoIdentidad` sigue siendo opcional (MySQL permite múltiples NULL en un índice único, así que dos clientes sin documento no colisionan).
- Nuevos enums: `EntidadImportacion`, `FormatoImportacion`, `EstadoImportacion` (completado/parcial), `EstadoFilaImportacion` (duplicado/invalido).
- Nuevos modelos `ImportacionHistorial` (un registro por archivo procesado hasta el final) e `ImportacionDetalle` (una fila por registro NO importado — duplicado o inválido; los importados solo se cuentan en el agregado `importados`, sin una fila por registro exitoso). `ImportacionDetalle` es la misma fuente para el detalle del historial y para regenerar el reporte de errores.
- Migración `20260714232950_centro_importaciones`, aplicada limpia (se verificó antes que no existieran duplicados reales en `clientes.documento_identidad` ni `perfiles_motorizados.placa`).

### Extensión mínima de los 3 módulos existentes (Clientes, Tiendas, Motorizados, Usuarios)

Ningún flujo de negocio existente cambió — solo se agregaron métodos de lectura nuevos, reutilizados tanto por el CRUD normal (para dar una respuesta 409 legible ante el nuevo constraint) como por Importaciones:

- `ClientesService.existeDocumentoDuplicado(documento)` (nuevo) + `crear`/`actualizar` ganan la misma validación previa que ya tenía Tiendas (`validarDocumentoDisponible` + captura de P2002).
- `PerfilesMotorizadosService.existePlacaDuplicada(placa)` y `existePerfilParaUsuario(usuarioId)` (nuevos, el segundo expone una verificación que `crear` ya hacía internamente) + `crear`/`actualizar` ganan la validación previa de placa.
- `TiendasService.existeDuplicado(nombre, ruc?)` (nuevo) — envuelve las 2 verificaciones que `crear`/`actualizar` ya hacían, sin duplicarlas.
- `UsuariosService.buscarPorUsuario(usuario)` (nuevo, de solo lectura) — resuelve un nombre de usuario a la cuenta completa; usado exclusivamente por el importador de Motorizados.

### Diseño de la importación de Motorizados: nunca crea una cuenta de Usuario

`PerfilesMotorizadosService.crear` ya exigía un `usuarioId` de una cuenta existente (nunca acepta datos de registro) — la importación de Motorizados respeta esa misma regla al pie de la letra: la columna `usuario` del archivo es el login de una cuenta ya creada desde el módulo Usuarios (rol motorizado, activa), nunca credenciales nuevas. Esto evita manejar contraseñas en texto plano dentro de un archivo de importación y evita el riesgo de una cuenta de Usuario huérfana si la creación del perfil fallara después de crear la cuenta.

### Arquitectura de la importación

- `common/imports/` (agnóstico de entidad, mismo espíritu que `common/exports/` de la Fase 18): `ImportReaderService` despacha a 3 lectores (`XlsxImportReader`/`JsonImportReader`/`XmlImportReader`), cada uno reduce el archivo a `FilaCruda[]` (`Record<string, string>`, todo como texto plano — `stringificarValor` evita `[object Object]` si un XML/JSON trae un valor anidado). Reutiliza `exceljs` y `xmlbuilder2` (ya instalados en la Fase 18, ahora también para leer, no solo escribir) — cero librerías nuevas para lectura.
- `modules/importaciones/importadores/` (uno por entidad — `ClientesImportador`, `TiendasImportador`, `MotorizadosImportador`, todos `IEntidadImportador`): un único método, `procesarFila(fila, dryRun)`, que valida (reutilizando el `Create*Dto` real de la entidad vía class-validator, exactamente la misma lógica que ya usa el ValidationPipe global — nunca reglas nuevas ni distintas por formato), detecta duplicados (reutilizando los métodos nuevos de solo lectura) y, solo si `dryRun` es false, efectivamente crea el registro. Así "analizar" y "confirmar" comparten el 100% de la lógica de validación/duplicados — la única diferencia es si se escribe o no.
- `ImportacionesService.procesarArchivo`: recorre las filas secuencialmente (nunca en paralelo — "transaccional por registro, no por archivo"), cuenta importados/duplicados/errores, arma el detalle. Con dryRun=true (analizar) no persiste nada; con dryRun=false (confirmar) persiste `ImportacionHistorial` + `ImportacionDetalle` al final.
- Red de seguridad por fila: `procesarFilaSinFallar` envuelve cada llamada a `importador.procesarFila` — cualquier excepción inesperada de una fila (verificada en pruebas: un usuario eliminado lógicamente entre el chequeo de duplicado y la escritura real) se reclasifica como esa fila inválida en vez de abortar el archivo completo, cumpliendo al pie de la letra "si una fila falla, no cancelar la importación completa".
- `usuarioId` (quién confirma) se valida ANTES de procesar cualquier fila: si no existiera, las filas ya se habrían creado sin ningún registro de auditoría — el "estado inconsistente" que esta fase pide evitar explícitamente. Verificado con una prueba real.
- Reporte de errores: nunca se genera ni se guarda un archivo — `ImportacionesService.obtenerReporteErrores` arma un ExportSolicitud a partir de los `ImportacionDetalle` ya persistidos y delega en `ExportService` (Fase 18, reutilizado tal cual) para regenerarlo en xlsx bajo demanda, cada vez que se pide (incluida una redescarga posterior desde el historial).
- Plantillas oficiales: 9 archivos estáticos (`src/modules/importaciones/plantillas/*.{xlsx,json,xml}`), generados una única vez con un script descartado tras su uso (nunca en tiempo de request). `nest-cli.json` gana una entrada `assets` para copiarlos a `dist/` en cada build.

### Endpoints agregados

`GET /importaciones/:entidad/plantilla?formato=`, `POST /importaciones/:entidad/analizar?formato=`, `POST /importaciones/:entidad/confirmar?formato=&usuarioId=` (multipart, campo `archivo`), `GET /importaciones/historial`, `GET /importaciones/historial/:id`, `GET /importaciones/historial/:id/reporte-errores`.

### Pruebas funcionales realizadas (contra MySQL real, servidor en modo watch)

- Los 9 formatos de plantilla descargan correctamente.
- Flujo completo (analizar → confirmar) probado con las 3 entidades y los 3 formatos (xlsx real subiendo la plantilla oficial, JSON, XML) — clasificación correcta de filas válidas/duplicadas/inválidas en cada caso.
- Idempotencia verificada explícitamente: reimportar el mismo archivo dos veces no generó ningún registro nuevo la segunda vez (conteo verificado en BD) — todas las filas antes válidas pasaron a duplicado.
- Importación parcial verificada: archivos con mezcla de filas válidas/duplicadas/inválidas nunca abortan — se importan las válidas y se reportan las demás.
- Casos de Motorizados verificados uno por uno: usuario inexistente (invalido), usuario inactivo (invalido), usuario ya con perfil (duplicado), placa ya en uso (duplicado), caso exitoso real.
- Bug real encontrado y corregido durante las pruebas: `usuarioId` inexistente en `confirmar` causaba que las filas ya escritas quedaran sin historial asociado (Foreign key constraint violated al crear el historial, después de ya haber escrito filas) — corregido validando `usuarioId` antes de procesar cualquier fila. Verificado que, corregido, un `usuarioId` inválido falla con 404 limpio sin efectos secundarios.
- Bug real encontrado y corregido durante las pruebas: un usuario motorizado eliminado lógicamente (deletedAt no nulo, pero activo=true) era resuelto como válido por `buscarPorUsuario` (que no filtra deletedAt, a propósito, para no tocar la lógica existente de Usuarios), pero `PerfilesMotorizadosService.crear` sí lo rechaza internamente (buscarPorId filtra deletedAt) — la excepción no clasificada escapaba y abortaba el archivo completo. Corregido con la red de seguridad por fila (`procesarFilaSinFallar`), sin tocar el módulo de Usuarios.
- Historial (lista paginada + detalle) y redescarga del reporte de errores verificados end-to-end.
- Casos de error: entidad inválida (400), formato inválido (400), archivo faltante (400), historial inexistente (404).
- Regresión: prisma validate OK, prisma generate OK, tsc --noEmit OK, npm run build OK, npm run lint (eslint + prettier) OK, npm test (unit) OK, npm run test:e2e OK.

### Problema de entorno resuelto (no relacionado con el código de esta fase)

La conexión a MySQL fallaba (RSA public key is not available client side) al reiniciar el contenedor Docker — MySQL 8 usa caching_sha2_password por defecto, que exige allowPublicKeyRetrieval=true en la cadena de conexión cuando el driver no tiene la clave RSA del servidor cacheada. Corregido agregando ese parámetro a DATABASE_URL (.env y .env.example) — bloqueaba todo el backend, no solo esta fase.

### Archivos modificados/creados

- prisma/schema.prisma, migración nueva.
- src/modules/clientes/, src/modules/tiendas/, src/modules/perfiles-motorizados/, src/modules/usuarios/ — extendidos con los métodos de lectura descritos arriba (servicio + repositorio + interfaz donde aplica).
- src/common/imports/ (nuevo): import.types.ts, stringificar-valor.util.ts, import-reader.service.ts, import.module.ts, readers/{xlsx,json,xml}-import.reader.ts.
- src/modules/importaciones/ (nuevo): importaciones.controller.ts, .service.ts, .repository.ts, .mapper.ts, .module.ts, .constants.ts, dto/_, importadores/_, interfaces/_, plantillas/_ (9 archivos estáticos).
- nest-cli.json (assets), .env/.env.example (allowPublicKeyRetrieval).
- API_OVERVIEW.md, ARCHITECTURE.md actualizados.

El backend vuelve a quedar en feature freeze al cerrar esta fase.

## Fase 18 — Módulo de Pagos (proyecto Fase 20)

Excepción explícita al feature freeze: módulo nuevo, `pagos`, para registrar uno o varios pagos por pedido (parciales y/o mixtos, cualquier combinación de métodos). No implementa Caja, Arqueo, Conciliación Bancaria ni Flujo de Caja — únicamente el registro histórico de pagos y su resumen calculado, tal como delimita esta fase.

### Modelo Prisma

- Nuevo enum `MetodoPago` (`efectivo`, `yape`, `plin`, `transferencia`, `tarjeta`) — conjunto cerrado, agregar un método nuevo en el futuro es una migración de bajo riesgo (un valor de enum), nunca un string libre.
- Nuevo modelo `Pago`: `id`, `pedidoId`, `metodoPago`, `monto` (`Decimal(10,2)`), `montoRecibido`/`vuelto` (`Decimal(10,2)?`, solo aplican a `efectivo`), `observacion`, `creadoPorId`, `creadoEn`. Relación `Pedido 1 → N Pago` (`Pedido.pagos Pago[]`, nunca se almacenan pagos dentro de `Pedido`) y `Usuario 1 → N Pago` (`creadoPor`, mismo patrón que `creadoPorId` en `Pedido`/`HistorialPedido`).
- **Ningún campo derivado se persiste**: total del pedido, total pagado, saldo pendiente y estado de pago nunca se guardan en la base de datos — se calculan en cada solicitud (ver `pagos-calculo.util.ts`).
- Migración `20260715043707_modulo_pagos`, aplicada limpia.
- `PedidosService.eliminar`: el mensaje de error ante violación de llave foránea ahora menciona "pagos" junto a "historial, fotos o incidentes" (antes de esta fase esa combinación no incluía pagos porque el modelo no existía) — único cambio de texto en el módulo `pedidos`, sin tocar ninguna regla de negocio ni el flujo operativo.

### Arquitectura (Validaciones / Persistencia / Cálculos separados)

- **`pagos-calculo.util.ts`**: funciones puras (`calcularVuelto`, `calcularResumenPago`) — única fuente de esta aritmética, sin acceso a Prisma ni a ningún servicio. Reutilizada exclusivamente por `PagosService`, nunca duplicada.
- **`PagosRepository`**: `crear`, `buscarPorPedido` (paginado) y `sumarMontoPorPedido` (agregación Prisma `_sum`, evita traer todas las filas a memoria solo para sumar). Sin métodos de actualización ni eliminación — un pago es un registro histórico inmutable, tal como pide la fase ("No permitir eliminar pagos. No implementar edición de pagos").
- **`PagosService`**: orquesta validación (reutiliza `PedidosService.buscarPorId`/`UsuariosService.buscarPorId` para "pedido inexistente"/"usuario inexistente", exactamente el mismo patrón que `FotosEntregaService`/`HistorialPedidoService`) + las reglas propias de "Efectivo" (monto recibido obligatorio, rechazo si es menor al monto, vuelto calculado) + delega el resumen en `pagos-calculo.util.ts`.
- **Total del pedido = `valorProducto + costoEnvio`** (los únicos dos campos monetarios que expone `Pedido`; ambos opcionales, se tratan como 0 si faltan) — asunción explícita, documentada aquí por no estar definida literalmente en la fase, pero es la única lectura posible dado el esquema actual de `Pedido`.
- **Total pagado = suma de `monto`, nunca de `montoRecibido`**: `montoRecibido` es información de manejo de efectivo (puede incluir vuelto), no lo efectivamente abonado a la deuda del pedido.
- **Saldo pendiente nunca es negativo** (`Math.max(0, ...)`): un sobrepago (no rechazado por esta fase — no está en la lista de validaciones pedidas) dado dado simplemente deja el pedido "pagado" con saldo 0, sin modelar crédito/excedente (fuera de alcance).
- **"Pedido sin permisos" (validación listada en la fase) no se implementó**: no existe ningún sistema de autorización/roles en el proyecto (decisión arquitectónica ya documentada, `ARCHITECTURE.md` §6) — no se inventó uno nuevo para esta fase. Queda como limitación ya conocida, no como omisión de esta fase.

### Endpoints agregados

`POST /pedidos/:id/pagos` (registrar), `GET /pedidos/:id/pagos` (listar, paginado), `GET /pedidos/:id/pagos/resumen` (total del pedido, total pagado, saldo pendiente, estado de pago). Sin `PATCH`/`DELETE` — confirmado con pruebas reales (ver abajo).

### Pruebas funcionales realizadas (contra MySQL real, servidor en modo watch)

- Los 5 métodos de pago registrados individualmente (efectivo, yape, plin, transferencia, tarjeta).
- Pago parcial (2 pagos que no completan el total) → `estadoPago: "pendiente"`, saldo correcto.
- Pago mixto (4 métodos distintos en el mismo pedido) → suma correcta, saldo correcto.
- Vuelto: monto=10/recibido=10 → vuelto=0; monto=100/recibido=150 → vuelto=50 — ambos verificados.
- Validaciones: monto ≤ 0 (400), método inexistente (400), monto recibido menor al monto (400), monto recibido en método distinto de efectivo (400, rechazado), efectivo sin monto recibido (400), pedido inexistente (404), usuario (`creadoPorId`) inexistente (404).
- Resumen recalculado correctamente tras cada pago; estado pasa a `"pagado"` exactamente cuando `totalPagado >= totalPedido`.
- Confirmado que `PATCH`/`DELETE` sobre `/pedidos/:id/pagos/:id` no existen (404 de ruta de Express, no hay handler registrado).
- Regresión: `prisma validate` ✓, `prisma generate` ✓, `tsc --noEmit` ✓, `npm run build` ✓, `npm run lint` (eslint + prettier) ✓, `npm test` (unit) ✓, `npm run test:e2e` ✓.

### Archivos modificados/creados

- `prisma/schema.prisma`, migración nueva.
- `src/modules/pedidos/pedidos.service.ts` (mensaje de error de `eliminar`, ver arriba).
- `src/modules/pagos/` (nuevo): `pagos.module.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`, `.mapper.ts`, `pagos-calculo.util.ts`, `dto/{crear-pago,pago-response,resumen-pago-pedido}.dto.ts`, `interfaces/pagos-repository.interface.ts`.
- `src/app.module.ts`, `src/main.ts` (tag Swagger "Pagos").
- `API_OVERVIEW.md`, `ARCHITECTURE.md` actualizados.

**El backend vuelve a quedar en feature freeze** al cerrar esta fase.

## Fase 19 — Integración del módulo de Pagos en Pedidos/Reportes (proyecto Fase 21)

Excepción explícita y acotada al feature freeze: **no se reimplementó nada del módulo `pagos`** (entidad, DTOs, endpoints y reglas de negocio de Fase 18/20 intactos, sin un solo cambio). Esta fase únicamente expone datos derivados de los pagos ya existentes a través de los endpoints de **Pedidos** y **Reportes**, para que el frontend pueda integrar la funcionalidad completamente (ver `FRONTEND_PROGRESS.md`, Fase 21).

### Diseño: lectura directa de la tabla `pago`, nunca una dependencia de módulo

- `PedidosModule` y `ReportesModule` no importan `PagosModule` ni inyectan `PagosService`/`PagosRepository` — evita acoplar dos módulos nuevos (y un ciclo de DI real: `PagosModule` ya importa `PedidosModule` para validar que el pedido exista). En su lugar, cada uno consulta la tabla `pago` directamente vía su propio `PrismaService` ya inyectado — el mismo precedente arquitectónico ya documentado en `ARCHITECTURE.md` §9 ("Reportes es deliberadamente independiente, consulta Prisma directamente en vez de los servicios de los módulos dueños").
- La aritmética (saldo pendiente, estado pagado/pendiente) se reutiliza tal cual desde `modules/pagos/pagos-calculo.util.ts` (`calcularResumenPago`, funciones puras sin DI) vía un import de TypeScript plano — cero duplicación de la fórmula, cero acoplamiento de módulo.
- Nuevo `common/utils/estado-pago-pedido.util.ts` (`calcularEstadoPagoPedido`) + `common/types/estado-pago-pedido.type.ts` (`EstadoPagoPedido = 'sin_pago' | 'pago_parcial' | 'pagado'`): un estado de 3 valores, más granular que el binario `pagado`/`pendiente` de `ResumenPagoPedidoDto` (Pagos) — una necesidad de visualización en tablas/reportes ("sin ningún pago" vs. "con pago parcial"), no una regla de negocio nueva de Pagos. Se deriva del mismo cálculo: `totalPagado === 0 ? 'sin_pago' : (pagado ? 'pagado' : 'pago_parcial')`.

### `PedidosService`: `estadoPago`/`saldoPendiente` en cada respuesta, sin N+1

- `IPedidosRepository.sumarMontoPagadoPorPedidos(pedidoIds)` (nuevo, de solo lectura): una única consulta `prisma.pago.groupBy({ by: ['pedidoId'], _sum: { monto: true } })` para un arreglo de ids.
- `PedidosService` gana dos métodos privados: `resumenPagoDe(pedido)` (un pedido, delega en el bulk con arreglo de 1) y `resumenPagoDeMuchos(pedidos)` (usado por `listar`: **una sola consulta agregada para toda la página**, sin importar su tamaño — mismo patrón ya usado por `ReportesRepository.reporteMotorizados` desde la Fase 10).
- `PedidosMapper.toResponseDto`/`toResponseDtoList` ahora reciben el resumen ya calculado (nunca lo calculan ellos mismos) y lo traducen a los 2 campos nuevos de `PedidoResponseDto`: `estadoPago` (`EstadoPagoPedido`) y `saldoPendiente` (string, `toFixed(2)`).
- `crear`/`buscarPorId`/`actualizar`/`eliminar`/`listar` — los 5 métodos de `PedidosService` — quedan enriquecidos. `eliminar` en particular: si tuvo éxito, el pedido nunca tenía pagos (el FK de `Pago.pedidoId` es `Restrict`), así que su resumen es siempre `sin_pago`/saldo completo — no se pierde ninguna garantía ya existente.
- **Ripple effect descubierto y corregido**: cambiar la firma de `PedidosMapper.toResponseDto`/`toResponseDtoList` (ahora exige el resumen) rompía 8 llamadas en `src/modules/flujo-pedido/flujo-pedido.service.ts` que invocaban el mapper directamente con 1 solo argumento (`confirmarRecojo`, `iniciarRuta`, `confirmarEntrega`, `asignarMotorizado`, `reasignarMotorizado`, `registrarClienteAusente`, `registrarRechazo`, `cancelarPedido`). Corregido redirigiendo esas 8 llamadas a `this.pedidosService.buscarPorId(actualizado.id)` (el servicio ya estaba inyectado en `FlujoPedidoService` para otras verificaciones) — reutiliza la lógica de enriquecimiento ya centralizada en `PedidosService`, en vez de duplicarla en un tercer lugar. Encontrado con `grep -rn "PedidosMapper\." src/modules` antes de asumir que el cambio de firma era seguro.

### `ReportesRepository`: mismo patrón, compartido por Pedidos y Entregas

- `REPORTE_PEDIDO_SELECT` gana `valorProducto`/`costoEnvio` (necesarios para el total del pedido).
- Nuevo método privado `enriquecerConPagos(pedidos)`: una única consulta `prisma.pago.groupBy({ by: ['pedidoId', 'metodoPago'], _sum: { monto: true } })` para toda la página — de la misma agrupación se derivan tanto el total pagado (suma de todos los métodos) como los métodos utilizados (sin duplicados), sin una segunda consulta. Compartido tal cual por `reportePedidos` y `reporteEntregas` — ambos reportes muestran un subconjunto distinto de los mismos campos calculados.
- `ReportePedidoRow`/`ReportePedidoItemDto` ganan 4 campos: `totalPagado`, `saldoPendiente`, `estadoPago`, `metodosUtilizados` (`MetodoPago[]`). El Reporte de Pedidos usa los 3 primeros más `metodosUtilizados`; el Reporte de Entregas usa `estadoPago` + `metodosUtilizados` — la diferenciación ocurre en las columnas de exportación (ver abajo) y en el frontend, nunca en el cálculo (una sola fuente de datos).
- **`reporteMotorizados` no se tocó** (instrucción explícita de esta fase: "No modificar Reporte de Productividad").

### Exportaciones: columnas ampliadas, infraestructura intacta

- `COLUMNAS_REPORTE_PEDIDOS` (Reporte de Pedidos): gana `totalPagado`, `saldoPendiente`, `metodosUtilizados`.
- Nuevo `COLUMNAS_REPORTE_ENTREGAS` (antes, Entregas reutilizaba el arreglo de columnas de Pedidos tal cual): gana `estadoPago`, `metodosUtilizados`, sin las columnas de monto que sí lleva Pedidos — `exportarReporteEntregas` ahora usa este arreglo en vez de `COLUMNAS_REPORTE_PEDIDOS`.
- `filaDesdePedido` (fila plana para exportar) agrega los 4 campos nuevos, con `estadoPago` traducido a etiqueta legible (`ESTADO_PAGO_LABEL`) y `metodosUtilizados` unido con comas.
- **La infraestructura de exportación (`ExportService`, los 5 exportadores, `ExportSolicitud`) no se tocó** — solo se ampliaron `columnas`/`filas`, tal como pide la fase ("No modificar la infraestructura de exportación. Solo ampliar el contenido exportado."). Nota de comportamiento preexistente (no introducida por esta fase): el exportador JSON siempre vuelca el objeto `filas` completo, ignorando la lista de `columnas` — a diferencia de Excel/PDF/CSV/XML, que sí respetan la selección de columnas. Verificado explícitamente que ambos reportes exportan columnas distintas en CSV/XLSX/PDF/XML.

### Pruebas funcionales realizadas (contra MySQL real, servidor en modo watch)

- `GET /pedidos` y `GET /pedidos/:id`: verificados los 3 estados (`sin_pago`, `pago_parcial`, `pagado`) sobre pedidos ya existentes con pagos reales de la Fase 20.
- `GET /reportes/pedidos` y `GET /reportes/entregas`: verificados `totalPagado`/`saldoPendiente`/`estadoPago`/`metodosUtilizados` con datos mixtos (pedido con 4 métodos distintos, pedido pagado con 2 métodos, pedidos sin pagos).
- Las 5 exportaciones (xlsx/pdf/csv/json/xml) de ambos reportes, verificadas con petición real — confirmado que CSV/XLSX/PDF/XML muestran columnas distintas por reporte (Pedidos: Total pagado/Saldo pendiente/Métodos utilizados; Entregas: Estado de pago/Métodos utilizados) y que las 5 devuelven 200 sin error.
- Flujo completo simulado a nivel de API (la misma secuencia que ejecuta el frontend al crear un pedido con pagos): crear pedido → registrar 3 pagos mixtos secuenciales (efectivo/yape/tarjeta, parcial → pagado) → verificado saldo/estado correctos en cada paso.
- Verificado que un pago que falla su propia validación (monto negativo, 400) nunca afecta al pedido ya creado — el pedido permanece intacto y consultable.
- Regresión: `tsc --noEmit` ✓, `npm run build` ✓, `npm run lint` (eslint + prettier, autofix aplicado) ✓, `npm test` (unit) ✓, `npm run test:e2e` ✓.

### Archivos modificados/creados

- `src/common/types/estado-pago-pedido.type.ts` (nuevo), `src/common/utils/estado-pago-pedido.util.ts` (nuevo).
- `src/modules/pedidos/`: `interfaces/pedidos-repository.interface.ts`, `pedidos.repository.ts`, `pedidos.service.ts`, `pedidos.mapper.ts`, `dto/pedido-response.dto.ts`.
- `src/modules/flujo-pedido/flujo-pedido.service.ts` (8 llamadas al mapper redirigidas a `pedidosService.buscarPorId`, import de `PedidosMapper` eliminado).
- `src/modules/reportes/`: `interfaces/reportes-repository.interface.ts`, `reportes.repository.ts`, `reportes.mapper.ts`, `reportes.service.ts`, `dto/reporte-pedido-item.dto.ts`.

**Ningún endpoint, DTO de entrada, ni regla de negocio del módulo `pagos` cambió.** El backend vuelve a quedar en feature freeze al cerrar esta fase.

## Fase 20.1 — Corrección funcional: el registro de pagos pasa del Administrador al Motorizado

**Cero cambios de código en el backend.** Esta fase corrige un error de modelado detectado en la revisión funcional de la Fase 21: el Administrador registraba pagos al crear un pedido, cuando en la operación real el cobro ocurre recién cuando el Motorizado entrega el pedido al cliente. La corrección es puramente de **orquestación en el frontend** — qué panel llama a `POST /pedidos/:id/pagos` y en qué momento del flujo — porque el endpoint ya era agnóstico de quién lo invoca (no hay JWT ni roles a nivel de request, sección 6 de `ARCHITECTURE.md`).

### Verificación realizada (sin ningún archivo `.ts` modificado)

- `prisma validate`, `tsc --noEmit`, `npm run lint` (eslint + prettier), `npm run build` — todos ✓, confirmando que el backend permanece exactamente como quedó al cierre de la Fase 19.
- Flujo completo simulado a nivel de API, reproduciendo exactamente la secuencia que ahora ejecuta el panel del Motorizado: crear pedido (Admin, sin pagos) → asignar motorizado → confirmar recojo → iniciar ruta → **registrar pagos mixtos (efectivo con vuelto + yape) → confirmar entrega**. Verificado que:
  - Un pago que falla su propia validación (`montoRecibido` menor al `monto`, 400) deja el pedido intacto en `en_ruta` — la entrega nunca se confirma parcialmente (comportamiento inherente al endpoint, ya existente desde la Fase 18, ahora aprovechado por el nuevo orden del frontend).
  - Con los pagos completos (`estadoPago: "pagado"`, saldo 0), `confirmarEntrega` funciona exactamente igual que antes — el DTO no cambió.
  - `confirmarEntrega` funciona también sin ningún pago registrado (pagos opcionales, no se inventó una regla de "cobro obligatorio" que el DTO no exige).
  - `GET /pedidos` y `GET /reportes/entregas` reflejan correctamente `estadoPago`/`metodosUtilizados` de los pedidos entregados en la prueba — sin regresión.

### Documentación actualizada

`ARCHITECTURE.md` §9 (nota aclaratoria: el módulo es agnóstico de quién lo llama, la corrección fue de orquestación frontend). Ver `Frontend/FRONTEND_PROGRESS.md`, Fase 20.1, para el detalle completo del nuevo flujo en el panel del Motorizado.

## Fase 21 — Nuevo sistema de almacenamiento de fotografías (LONGBLOB)

Decisión arquitectónica definitiva, solicitada explícitamente: las fotografías de recojo/entrega dejan de almacenarse como URL (`FotoEntrega.urlImagen`) y pasan a almacenarse directamente en MySQL como binario. Proyecto sin datos de producción — **no se implementó ningún script de migración de datos ni compatibilidad hacia atrás**, tal como se pidió explícitamente.

### Base de datos y Prisma

- `FotoEntrega.urlImagen` (`String @db.VarChar(500)`) eliminado por completo. Reemplazado por `imagen` (`Bytes @db.LongBlob`) y `mimeType` (`String @default("image/webp") @db.VarChar(50)`). Sin campos adicionales (ancho/alto/peso/hash/EXIF/miniaturas) — explícitamente fuera de alcance.
- **Migración `20260715192407_fotos_entrega_longblob`**: agregar `imagen` como `NOT NULL` sin default es incompatible con filas existentes (18 filas de prueba) — `prisma migrate dev` lo bloqueó automáticamente al detectar la pérdida de datos. Se vació la tabla `fotos_entrega` explícitamente (`prisma db execute`, `DELETE FROM fotos_entrega;`) antes de generar la migración, tal como autoriza la fase ("si se pierden fotografías de prueba, es completamente aceptable") — sin script de migración de datos, sin conservar `urlImagen` en paralelo.
- `prisma generate` regenerado; el campo `FotoEntrega.imagen` se tipa como `Bytes` en el cliente (equivalente a `Uint8Array<ArrayBuffer>` en TypeScript — no `Buffer`, ver nota de compatibilidad de tipos más abajo).

### Arquitectura: transporte, validación y recuperación

- **Transporte exclusivo: `multipart/form-data`** — nunca Base64, nunca JSON. Reutiliza `@nestjs/platform-express` (`FileInterceptor`/`FilesInterceptor`), el mismo mecanismo ya usado por Importaciones (Fase 19), sin librerías nuevas.
  - `POST /pedidos/:id/confirmar-recojo`: campo `foto` (un único archivo, `FileInterceptor`).
  - `POST /pedidos/:id/confirmar-entrega`: campo `fotos` (uno o varios, `FilesInterceptor`) + campo de texto opcional `fotoPrincipalIndex` (índice 0-based dentro del arreglo subido) — reemplaza al antiguo `esPrincipal` por objeto, ya que multipart no transporta naturalmente un arreglo de objetos con archivo + metadata por elemento. `DTO` de cada endpoint (`ConfirmarRecojoDto`/`ConfirmarEntregaDto`) ya no tiene ningún campo de imagen — solo los campos de texto (`motorizadoId`, `observaciones`, `fotoPrincipalIndex`).
  - `foto-entrega-input.dto.ts` (el antiguo DTO anidado con `urlImagen`/`esPrincipal` por foto) se eliminó por completo — ya no tiene ningún uso.
- **Validación centralizada** (`modules/fotos-entrega/foto-entrega.validator.ts`, funciones puras sin inyección de dependencias, importadas directamente por `FlujoPedidoController`): `FOTO_ENTREGA_MIME_PERMITIDO = 'image/webp'` (único formato aceptado, 400 con mensaje explícito si no coincide) y `FOTO_ENTREGA_TAMANIO_MAXIMO_BYTES = 5 * 1024 * 1024` (aplicado vía `limits.fileSize` del interceptor, mismo patrón que `LIMITE_ARCHIVO_BYTES` de Importaciones — ninguna validación repetida entre los dos controllers que reciben fotos).
- **Recuperación: nuevo endpoint `GET /pedidos/:id/fotos/:fotoId/imagen`** — sirve el binario (`StreamableFile` + header `Content-Type` tomado de `mimeType`) leyendo directamente desde MySQL, sin archivos temporales ni exportación a disco. Valida que la foto pertenezca al pedido de la ruta (404 si no, incluso si la foto existe pero pertenece a otro pedido — evita enumerar fotos ajenas). El listado paginado (`GET /pedidos/:id/fotos`) sigue devolviendo solo metadata (nunca el binario, que sería enormemente ineficiente en una respuesta paginada).
- La transaccionalidad de `FlujoPedidoRepository.confirmarRecojo`/`confirmarEntrega` no cambió: la(s) fila(s) de `fotos_entrega` se siguen creando dentro de la misma `$transaction` que actualiza `Pedido` y escribe `historial_pedido` — solo cambiaron los campos persistidos.

### Nota de compatibilidad de tipos (TypeScript/Prisma)

Prisma 7 tipa `Bytes` como `Uint8Array<ArrayBuffer>` (no `Buffer`) en su cliente generado. El `Buffer` que expone Multer (`Express.Multer.File.buffer`) es estructuralmente un `Uint8Array<ArrayBufferLike>` — un tipo más amplio que incluye `SharedArrayBuffer`, que TypeScript 5.7+ ya no considera asignable a `Uint8Array<ArrayBuffer>`. Resuelto convirtiendo explícitamente con `Uint8Array.from(archivo.buffer)` en el límite de entrada (`FlujoPedidoService`) y tipando `imagen` como `Uint8Array<ArrayBuffer>` (nunca `Buffer`) en las interfaces internas (`FotoEntregaInput`, `ConfirmarRecojoData`, `ImagenFotoEntrega`) — sin este ajuste, `tsc` rechaza la asignación al crear/leer una `FotoEntrega`.

### Pruebas funcionales realizadas (contra MySQL real, servidor en modo watch)

- Flujo completo real: crear pedido → asignar motorizado → **confirmar recojo (multipart, 1 foto `image/webp`)** → iniciar ruta → **confirmar entrega (multipart, 2 fotos, `fotoPrincipalIndex=1`)** → verificado que la foto de recojo queda `esPrincipal: true` (regla ya existente, sin cambios) y que de las 2 fotos de entrega, solo el índice 1 quedó `esPrincipal: true`.
- **Recuperación de imagen verificada byte a byte**: se descargó el binario servido por `GET .../fotos/:fotoId/imagen` y se comparó (`diff`) contra el archivo originalmente subido — idénticos, confirmando el round-trip completo (subida → `LONGBLOB` → lectura) sin pérdida ni corrupción, y el header `Content-Type: image/webp` correcto.
- **Validación MIME**: un archivo con `Content-Type` distinto de `image/webp` fue rechazado con `400` y mensaje explícito (`"Formato de imagen no soportado ('application/octet-stream')..."`).
- **Validación de archivo faltante**: `confirmar-recojo` sin campo `foto` y `confirmar-entrega` sin ningún archivo en `fotos` fueron rechazados con `400` (`"Debe adjuntar una fotografia"`/`"...al menos una fotografia"`).
- **Aislamiento entre pedidos**: `GET /pedidos/:id/fotos/:fotoId/imagen` con un `id` de pedido que no es dueño de esa foto responde `404` (`"Foto no encontrada"`), no expone el binario de otro pedido.
- **Regresión**: `GET /pedidos/:id/historial` del pedido de prueba muestra los 4 eventos esperados (asignado/recogido/en_ruta/entregado) sin cambios — el flujo operativo no sufrió ninguna regresión.
- `grep` exhaustivo confirmando **cero** referencias a `urlImagen` en todo `src/`/`prisma/` (fuera de un comentario explicativo).
- `prisma validate` ✓, `prisma generate` ✓, `tsc --noEmit` ✓, `npm run build` ✓, `npm run lint` (eslint) ✓, `npm test` (unit) ✓, `npm run test:e2e` ✓.

### Archivos modificados/creados

- `prisma/schema.prisma`, migración nueva (`20260715192407_fotos_entrega_longblob`).
- `src/modules/fotos-entrega/`: `foto-entrega.validator.ts` (nuevo), `interfaces/fotos-entrega-repository.interface.ts`, `fotos-entrega.repository.ts`, `fotos-entrega.service.ts`, `fotos-entrega.controller.ts`, `fotos-entrega.mapper.ts`, `dto/foto-entrega-response.dto.ts`.
- `src/modules/flujo-pedido/`: `interfaces/flujo-pedido-repository.interface.ts`, `flujo-pedido.repository.ts`, `flujo-pedido.service.ts`, `flujo-pedido.controller.ts`, `dto/confirmar-recojo.dto.ts`, `dto/confirmar-entrega.dto.ts`; `dto/foto-entrega-input.dto.ts` eliminado.
- `ARCHITECTURE.md`, `API_OVERVIEW.md` actualizados.

**No se modificó ningún otro módulo** (Pedidos, Historial, Usuarios, Clientes, Tiendas, Sucursales, Motorizados, Pagos, Reportes, Dashboard, Importaciones, Exportaciones) — el backend vuelve a quedar en feature freeze al cerrar esta fase, salvo por la captura desde cámara y la optimización de imágenes, explícitamente diferidas a la siguiente fase (y explícitamente fuera del alcance del Frontend en esta).

## Fase 21.1 — Exponer `totalPedido`/`totalPagado` en `PedidoResponseDto`

Pedido del Frontend: reemplazar la columna "Saldo" de la tabla de Pedidos por tres columnas (Total del pedido, Total pagado, Pendiente). Antes de tocar nada se verificó si el dato ya existía: `PedidosService.resumenPagoDeMuchos` (Fase 21) ya calcula `totalPedido` y `totalPagado` para cada pedido — una sola consulta agregada por página, reutilizada tanto por `listar` como por `buscarPorId` — pero `PedidosMapper` solo copiaba `estadoPago`/`saldoPendiente` al DTO de respuesta, descartando los otros dos campos ya calculados.

**Cambio, puramente aditivo**: se agregaron `totalPedido: string` y `totalPagado: string` a `PedidoResponseDto` (`dto/pedido-response.dto.ts`) y se completó el mapeo en `PedidosMapper.toResponseDto` (`resumenPago.totalPedido.toFixed(2)` / `resumenPago.totalPagado.toFixed(2)`, mismo patrón que `saldoPendiente`). **Cero consultas nuevas, cero lógica de negocio nueva** — `ResumenPagoPedidoCalculado` ya traía ambos valores desde `estado-pago-pedido.util.ts`. `saldoPendiente`/`estadoPago` se dejaron intactos (compatibilidad de API): ningún consumidor existente se rompe, solo se agregan dos campos nuevos.

**Archivos modificados**: `src/modules/pedidos/dto/pedido-response.dto.ts`, `src/modules/pedidos/pedidos.mapper.ts`. Ningún otro archivo del backend (Reportes usa su propio DTO `ReportePedidoItemDto`, no se tocó).

**Pruebas**: `tsc --noEmit` ✓. Verificado contra MySQL real: `GET /pedidos/:id` y `GET /pedidos?page=&limit=` devuelven `totalPedido`/`totalPagado`/`saldoPendiente` consistentes (`totalPedido - totalPagado = saldoPendiente` en ambos endpoints, confirmando que el listado paginado usa la misma aritmética agregada que el detalle, sin N+1).

## Bugfix — `Cross-Origin-Resource-Policy` bloqueaba la carga de fotos en el navegador

**Síntoma** (reportado tras la mejora de miniaturas/preview en el Frontend): las fotografías nunca llegaban a renderizarse como `<img>` — ni antes ni después de esa mejora — aunque `GET /pedidos/:id/fotos/:fotoId/imagen` respondía `200 OK` con el `Content-Type` correcto.

**Causa raíz**: `helmet()` (`main.ts`, sin configuración explícita) agrega por defecto `Cross-Origin-Resource-Policy: same-origin` a **todas** las respuestas. El Frontend (Vite, puerto 5173) y el Backend (puerto 3000) son orígenes distintos — el navegador aplica esta política y **bloquea silenciosamente** cualquier `<img src>`/`fetch` cross-origin hacia ese endpoint, disparando el evento `error` en el `<img>`, aunque la petición HTTP en sí sea exitosa. `curl` nunca lo detectó porque CORP es una política exclusivamente de navegador. El único motivo por el que "antes funcionaba" es que el Frontend usaba un `<a href target="_blank">` (una navegación de nivel superior, no un subrecurso embebido — CORP no aplica ahí), nunca una miniatura realmente renderizada.

**Archivo modificado**: `src/modules/fotos-entrega/fotos-entrega.controller.ts` — se agrega `'Cross-Origin-Resource-Policy': 'cross-origin'` junto al `Content-Type` ya existente, **únicamente** en la respuesta de `GET /pedidos/:id/fotos/:fotoId/imagen` (el único endpoint pensado para incrustarse como `<img>` desde un origen distinto). Ningún otro endpoint se tocó — el resto de la API conserva `same-origin` por defecto de `helmet()`, verificado explícitamente (`GET /pedidos/:id/fotos` sigue devolviendo `same-origin`).

**Pruebas**: verificado con headers reales contra el servidor corriendo: el endpoint de imagen ahora responde `Cross-Origin-Resource-Policy: cross-origin`; el endpoint de listado (`/fotos`) sigue en `same-origin`, confirmando que el cambio quedó acotado. `tsc --noEmit`, `eslint`, `prettier --check`, `npm run build` sin errores.

## Fase 22 — Código de negocio profesional para `codigoPedido` (proyecto Fase 24)

Reemplazo de `codigoPedido = id.toString()` (decisión de la Fase 7) por un código de negocio real: **`PED-AAAA-NNNNNN`** (ej. `PED-2026-000042`). Cambio puramente de generación — **cero cambios de esquema, migraciones, DTOs, endpoints o relaciones**; la columna `codigo_pedido` ya existía (`VarChar(30)`, `@unique`) y sigue exactamente igual.

### Estrategia de generación

- **`AAAA`**: el año de `Pedido.creadoEn` (el timestamp real de creación, ya devuelto por `tx.pedido.create()` dentro de la misma transacción) — **nunca `new Date()`**, para que el código siempre refleje cuándo el pedido realmente se creó, no el momento en que se ejecuta el código.
- **`NNNNNN`**: el `id` autoincremental, rellenado a 6 dígitos con ceros a la izquierda. Es un consecutivo global que nunca reinicia por año (ej. `PED-2026-000999` → `PED-2027-001000`) — deliberadamente **sin** contador anual ni tabla auxiliar: el `id` ya es único y estrictamente creciente, así que no hace falta ninguna infraestructura adicional para lograr esa propiedad.

### Componente centralizado: `PedidoCodigoGenerator`

`src/modules/pedidos/pedido-codigo.generator.ts` (nuevo) — clase con un único método estático `generar(id: bigint, creadoEn: Date): string`, mismo patrón ya usado por `PedidosMapper` (métodos `static`, sin inyección de dependencias, pura función de transformación). Es el **único** punto del backend que construye este string — `pedidos.repository.ts` es su único consumidor. Si el formato cambia en el futuro, se edita únicamente este archivo.

### Integración

`pedidos.repository.ts.crear()` mantiene exactamente el mismo mecanismo ya existente (valor transitorio único durante el insert, porque el `id` autoincremental no se conoce antes de crear la fila, corregido en la misma `$transaction`) — solo cambió qué valor final se escribe: antes `creado.id.toString()`, ahora `PedidoCodigoGenerator.generar(creado.id, creado.creadoEn)`.

### Datos existentes

Proyecto sin producción (dato explícito del pedido de esta fase): se actualizaron los 17 pedidos existentes con un script puntual de backfill (ejecutado una sola vez con `ts-node`, reutilizando `PedidoCodigoGenerator` para garantizar el mismo formato exacto que generarán los pedidos nuevos, y luego eliminado del repositorio — no es infraestructura permanente). **Cero migración de Prisma**: es una actualización de valores de fila, no de esquema.

### Pruebas realizadas

- `prisma validate` ✓, `prisma generate` ✓, `tsc --noEmit` ✓, `eslint` ✓, `prettier --check` ✓, `npm run build` ✓.
- **Backfill verificado**: `GET /pedidos?page=&limit=` muestra los 17 pedidos existentes con el nuevo formato (`PED-2026-000024` … `PED-2026-000041`).
- **Creación real**: `POST /pedidos` con datos válidos generó `PED-2026-000042` para un pedido con `id=42`, año tomado de su `creadoEn` real.
- **Búsqueda por código**: `GET /pedidos?codigoPedido=PED-2026-000042` (exacto) y `GET /pedidos?codigoPedido=000042` (parcial, mismo filtro `contains` ya existente, sin cambios) devuelven el pedido correcto.
- **Reportes/exportaciones**: `GET /reportes/pedidos` y `GET /reportes/pedidos/export?formato=json` devuelven `codigoPedido` con el nuevo formato (reutilizan el mismo campo persistido, sin lógica propia de generación).
- **`npm test`/`npm run test:e2e`**: **no ejecutables en este entorno** — fallan con `"Module ts-jest in the transform option was not found"`. Confirmado con `git stash` que esta falla es **preexistente y no relacionada** con los cambios de esta fase (falla exactamente igual en `main` sin ningún cambio aplicado) — parece un problema de resolución de módulos de Jest/ts-jest en este entorno, ajeno al alcance de esta fase. Se documenta como limitación, no se intentó arreglar (fuera de alcance).

### Archivos modificados

- `src/modules/pedidos/pedido-codigo.generator.ts` (nuevo).
- `src/modules/pedidos/pedidos.repository.ts` (usa el generador en `crear()`).
- `ARCHITECTURE.md` (§6, decisión actualizada).

**No se modificó**: schema.prisma, migraciones, DTOs, controllers, endpoints, ni ningún otro módulo (Reportes, Importaciones, Pagos, Flujo de Pedido, etc. — todos leen `codigoPedido` ya persistido, sin generarlo).

## Fase 23 — Filtro por rol en el listado de Usuarios (proyecto Fase 25)

Se agregó el parámetro opcional `rol` a `GET /usuarios` (`?rol=administrador`/`?rol=motorizado`), combinable con los filtros ya existentes (`usuario`, `correo`). **Mismo endpoint, sin endpoints nuevos.**

### Cambios (mismo patrón ya usado por `estado` en `ListPedidosQueryDto`)

- `dto/list-usuarios-query.dto.ts`: campo `rol?: RolUsuario` con `@IsOptional() @IsEnum(RolUsuario)` — un valor fuera del enum responde `400` (whitelist/enum de `class-validator`, sin tocar `ValidationPipe`).
- `interfaces/usuarios-repository.interface.ts`: `BuscarUsuariosParams.rol?: Usuario['rol']`.
- `usuarios.repository.ts`: `...(params.rol ? { rol: params.rol } : {})` agregado directamente al `where` de Prisma (`buscarMuchos`) — filtro por igualdad exacta (no `contains`, es un enum), **nunca en memoria**.
- `usuarios.service.ts`: pasa `query.rol` al repositorio.
- Controller: **sin cambios** — ya delega `@Query() query: ListUsuariosQueryDto` completo al servicio.

### Pruebas realizadas

Contra el servidor real: sin filtro (13 usuarios, todos los roles), `rol=administrador` (9, todos administrador), `rol=motorizado` (4, todos motorizado), `usuario=jey&rol=motorizado` (1 resultado exacto), `usuario=jey&rol=administrador` (0, confirma AND real no OR), `correo=gmail&rol=motorizado` (1), `usuario=jey&correo=gmail&rol=motorizado` (los 3 combinados, 1 resultado), `rol=superadmin` (400, enum inválido rechazado), paginación con filtro (`page=1`/`page=2` con `rol=administrador`, mismo `total=9` en ambas, filtro persistente entre páginas). `tsc --noEmit` ✓, `eslint` ✓, `npm run build` ✓.

### Archivos modificados

`dto/list-usuarios-query.dto.ts`, `interfaces/usuarios-repository.interface.ts`, `usuarios.repository.ts`, `usuarios.service.ts`. **No se tocó**: `usuarios.controller.ts`, ningún otro módulo, ni la arquitectura existente.

## Fase 24 — Estandarización de plantillas de Importación (proyecto Fase 26)

Estandarización de las 9 plantillas descargables (Clientes/Tiendas/Motorizados × xlsx/json/xml), sin tocar el flujo de importación, la base de datos, ni los DTOs públicos (`Cliente`, `Usuario`, `PerfilMotorizado` intactos).

### Regla 1 — Plantillas vacías

Las 3 plantillas `.xlsx` traían 2 filas de ejemplo con datos ficticios (`"Juan Perez Garcia"`, `"carlos.rojas"`, etc.) — se regeneraron con **cero** filas de datos (solo encabezado). `.json` pasó de un arreglo con 2 objetos de ejemplo a `[]`; `.xml` pasó de 2 `<registro>` con datos a `<registros/>` vacío. Decisión explícita: no se agregó ningún objeto/registro "de referencia" con valores vacíos en json/xml (seguiría siendo una fila precargada) — la única fuente de nombres de campo para esos 2 formatos es, como ya era antes de esta fase, la plantilla `.xlsx` (única con hoja de instrucciones, ver Regla 4).

### Regla 2 — Personas: `nombres`/`apellidos`

**Solo aplica a Clientes** (única entidad importable que persiste un nombre de persona con campo propio). La plantilla y el archivo de origen ahora traen `nombres`/`apellidos` en vez de `nombreCompleto`. `ClientesImportador.procesarFila` concatena `[fila.nombres, fila.apellidos].filter(Boolean).join(' ')` **antes** de validar contra `CreateClienteDto` (sin tocar ese DTO ni la columna `nombre_completo`) — el resto de la validación, detección de duplicados (por `documentoIdentidad`) y creación es exactamente el mismo código de antes de esta fase.

Motorizados **no tiene** un campo de nombre en su plantilla: el importador vincula un perfil a una cuenta de `Usuario` ya existente por su `usuario` (login) — el nombre de esa persona vive en `Usuario`, fuera del alcance explícito de esta fase ("no cambiar el modelo Usuario"). No había nada que separar ahí.

### Regla 3 — Entidades no personales

Tiendas mantiene su estructura (`nombre`, `ruc`) sin cambios — solo se le aplicó el nuevo estándar visual/de contenido (Reglas 1, 4, 5).

### Regla 4 — Hoja de Instrucciones

Cada plantilla `.xlsx` ahora tiene 2 hojas: `Plantilla` (encabezados) e `Instrucciones` (nueva). La hoja de Instrucciones incluye, para las 3 entidades: las 7 reglas generales pedidas (no modificar encabezados, no eliminar columnas, no cambiar el orden, una fila = un registro, duplicados se omiten automáticamente, reporte de rechazados descargable, no dejar filas vacías entre registros) + una tabla de campos con su descripción y si son obligatorios/opcionales + la regla de duplicados específica de esa entidad (mismo texto ya usado por `InstruccionesModal` del Frontend, Fase 19) + una nota adicional para Motorizados (la cuenta de usuario debe existir previamente).

### Regla 5 — Diseño uniforme

Las 3 plantillas comparten: mismo nombre de hojas (`Plantilla`/`Instrucciones`), mismo color de encabezado (azul `#2563EB`, texto blanco negrita), mismo borde delgado gris en las celdas de encabezado, y el mismo algoritmo de ancho de columna (`longitud del encabezado + 6, mínimo 14`) — no un ancho idéntico entre columnas de contenido distinto (eso se vería roto), sino la misma **regla** de cálculo aplicada a las 3 plantillas por igual.

### Backend: cambios de código (mínimos, solo lectura/mapeo)

- `importadores/clientes.importador.ts`: `columnas` actualizado a `['nombres', 'apellidos', 'telefono', 'direccion', 'documentoIdentidad']`; `procesarFila` concatena antes de validar. Es el **único** archivo `.ts` modificado — `tiendas.importador.ts` y `motorizados.importador.ts` no se tocaron (Regla 3).
- 9 archivos de `modules/importaciones/plantillas/` regenerados (assets estáticos, no código de aplicación) con un script puntual (`exceljs`, ya dependencia existente), ejecutado una sola vez y luego eliminado del repositorio — mismo patrón ya usado para el backfill de `codigoPedido` (Fase 21.1/proyecto 24).

### Compatibilidad mantenida

Mismos endpoints (`GET .../plantilla`, `POST .../analizar`, `POST .../confirmar`), mismo contrato HTTP, mismas respuestas, mismos DTOs públicos. Un archivo de importación de Clientes con el **formato viejo** (columna `nombreCompleto`) ahora fallaría — es un cambio de contrato de **archivo de entrada**, no de API; el proyecto no está en producción y no existen integraciones externas que dependan del formato anterior (mismo criterio ya aprobado en la Fase 24 para los datos existentes).

### Pruebas realizadas

- **Descarga de las 9 plantillas** vía HTTP real: las 3 `.xlsx` traen exactamente 2 hojas (`Plantilla`, `Instrucciones`) y 0 filas de datos; las 3 `.json` devuelven `[]`; las 3 `.xml` devuelven `<registros/>` vacío.
- **Importación real con el nuevo formato**: `analizar` y `confirmar` con un archivo de 3 filas (`nombres`/`apellidos`) — 1 fila importada, 1 duplicada (mismo `documentoIdentidad`, detectada correctamente en `confirmar` porque el procesamiento es secuencial), 1 inválida (`nombres`/`apellidos` vacíos → `nombreCompleto` vacío → rechazada por la validación ya existente de `CreateClienteDto`, sin ninguna regla nueva). Verificado en la base de datos que el cliente creado quedó con `nombre_completo = "Ana Torres Vega"`.
- **Reporte de errores**: regenerado sin regresión para la importación de prueba (mismas 2 filas rechazadas, mismos campos/motivos).
- `prisma validate` ✓, `prisma generate` ✓, `tsc --noEmit` ✓, `eslint` ✓, `npm run build` ✓ (incluye copia de los assets de plantillas a `dist/`, confirmada con los tamaños de archivo correctos tras un build limpio).

### Archivos modificados

`importadores/clientes.importador.ts`, los 9 archivos en `plantillas/`, `ARCHITECTURE.md` (§8). **No se tocó**: `tiendas.importador.ts`, `motorizados.importador.ts`, `importaciones.service.ts`, `importaciones.controller.ts`, ningún DTO público, ni el schema de Prisma.

### Problemas encontrados

Uno, transitorio y ya resuelto: al regenerar las plantillas con el servidor corriendo en modo `watch` (`nest start --watch`, que copia assets automáticamente vía `watchAssets`), 2 de los 3 `.xlsx` quedaron en `dist/` con 0 bytes por una condición de carrera entre la escritura del archivo y la copia del watcher. Se corrigió copiando manualmente los archivos correctos a `dist/` y se confirmó que un `npm run build` limpio (sin watch mode corriendo en paralelo) copia los 3 archivos con su tamaño correcto — no es un problema del código de la aplicación, solo de la secuencia de esta regeneración puntual en modo desarrollo.

## Fase 25 — Corrección de los 3 hallazgos críticos de la Auditoría (proyecto Fase 28)

Corrección puntual y acotada de los 3 hallazgos 🔴 críticos de la auditoría integral (proyecto Fase 27): límite de exportación sin cota, condición de carrera en el RUC de Tiendas, e inyección de fórmulas en Excel/CSV. **Cero cambios de contrato HTTP, cero DTOs públicos modificados, cero funcionalidad nueva.**

### C1 — Límite máximo de filas exportables (50,000)

`common/utils/fetch-all-pages.util.ts` — `fetchAllPages` acepta ahora un tercer parámetro opcional `limiteMaximo`. En cada iteración del bucle ya existente (que de todos modos recibe `total` en cada página), si `total > limiteMaximo` se lanza `BadRequestException` (400) con un mensaje que indica acotar el rango de fechas o aplicar más filtros — **antes** de acumular una sola fila adicional y **antes** de que cualquier exportador reciba datos. Sin el tercer parámetro (cualquier otro llamador futuro que no lo pase), el comportamiento es idéntico al de antes de esta corrección — cambio 100% aditivo y retrocompatible en la firma de la función.

`reportes.service.ts` — se agregó la constante `LIMITE_EXPORTACION_FILAS = 50_000` y se pasó a los 3 `fetchAllPages(...)` ya existentes (`exportarReportePedidos`/`exportarReporteEntregas`/`exportarReporteMotorizados`). **Ningún exportador (`ExcelExporter`/`PdfExporter`/`CsvExporter`/`JsonExporter`/`XmlExporter`) se tocó** — la corrección vive enteramente antes de que cualquiera de ellos reciba una sola fila, tal como exigía el alcance de esta fase.

### C2 — Unicidad de `Tienda.ruc` a nivel de base de datos

`prisma/schema.prisma` — `Tienda.ruc` ahora es `@unique` (mismo patrón ya usado para `Cliente.documentoIdentidad`/`PerfilMotorizado.placa` en la Fase 19: MySQL permite múltiples `NULL` en un índice único, así que el campo sigue siendo opcional sin restricción para quien no lo provee). **`nombre` deliberadamente no se tocó** — el alcance de esta fase es únicamente el RUC.

Migración nueva: `20260717145151_tienda_ruc_unique` (`CREATE UNIQUE INDEX tiendas_ruc_key ON tiendas(ruc)`). Se verificó antes de aplicarla que no existían RUCs duplicados en los datos actuales (consulta `GROUP BY ruc HAVING COUNT(*) > 1`, cero resultados) — la migración no requirió ningún backfill ni limpieza de datos.

**Sin cambios de código en `tiendas.service.ts` ni en `tiendas.importador.ts`**: ambos ya capturaban `isUniqueConstraintViolation` y lo traducían a `ConflictException` (409, mensaje "El nombre o RUC de la tienda ya esta en uso") desde que existe el módulo — código defensivo que hasta ahora nunca se activaba porque no existía ninguna restricción real que violar. Con el `@unique` de esta fase, esa captura pasa de código muerto a la pieza que realmente cierra la condición de carrera (verificar-luego-escribir) entre dos solicitudes concurrentes o dos importaciones simultáneas. Se confirmó con una inserción SQL directa (bypaseando la aplicación) que la base de datos rechaza un RUC duplicado — la garantía ya no depende únicamente de la verificación previa de la aplicación.

### C3 — Protección contra CSV/Excel Formula Injection

`common/exports/sanitizar-celda-export.util.ts` (nuevo) — única función `sanitizarCeldaExport(valor)`: si el valor es un `string` no vacío y su primer carácter es `=`, `+`, `-`, `@`, tab o retorno de carro, antepone un apóstrofe (mitigación estándar de OWASP para CSV Injection). Los valores `number` nunca se tocan (un `-5` no es una fórmula). Único punto de saneamiento — reutilizado por `ExcelExporter` y `CsvExporter`, ninguno duplica la lógica.

`excel/excel.exporter.ts` y `csv/csv.exporter.ts` — el valor de cada celda de datos (nunca los encabezados ni la metadata del reporte, que son texto fijo del propio backend) pasa por `sanitizarCeldaExport` antes de escribirse. **`JsonExporter`, `XmlExporter` y `PdfExporter` no se tocaron** (JSON es intrínsecamente seguro; XML ya escapaba correctamente vía `xmlbuilder2`; PDF no interpreta fórmulas).

### Pruebas realizadas

- **C1**: simulación aislada de `fetchAllPages` con un `total` de 49,999/50,000/50,001/200,000 — confirmado que el límite exacto (50,000) se permite y que cualquier valor por encima se rechaza con `400` y el mensaje esperado; export real de un pedido de prueba (muy por debajo del límite) confirmado exitoso end-to-end.
- **C2**: `POST /tiendas` con RUC nuevo → `201`; mismo RUC de nuevo → `409` ("El RUC ya esta en uso"); inserción SQL directa con el mismo RUC (bypaseando la aplicación) → rechazada por MySQL (`Duplicate entry ... for key 'tiendas_ruc_key'`), confirmando que la garantía real está en la base de datos; dos tiendas sin RUC creadas sin conflicto (`NULL` no cuenta como duplicado); importación masiva de 3 tiendas con 1 RUC repetido → 2 importadas, 1 duplicada (`estado: 'duplicado'`, motivo "El RUC ya esta en uso"), la importación continuó sin abortar.
- **C3**: prueba directa de la utilidad con los 4 payloads de la fase (`=HYPERLINK(...)`, `+SUM(...)`, `-CMD`, `@formula`) más tab/CR/texto normal/números — todos los casos peligrosos correctamente prefijados, texto normal y números intactos; prueba end-to-end real: tienda creada con nombre `=HYPERLINK("http://evil.test","click")`, pedido asociado, exportado en `.xlsx` y `.csv` reales — en ambos archivos el valor quedó como `'=HYPERLINK(...)` (con apóstrofe), confirmado leyendo el binario xlsx con `exceljs` y el CSV crudo.
- `prisma validate` ✓, `prisma generate` ✓, migración aplicada con `prisma migrate deploy` ✓, `tsc --noEmit` ✓, `eslint` ✓, `npm run build` ✓.

### Archivos modificados

- `prisma/schema.prisma`, migración `prisma/migrations/20260717145151_tienda_ruc_unique/`.
- `src/common/utils/fetch-all-pages.util.ts`, `src/modules/reportes/reportes.service.ts`.
- `src/common/exports/sanitizar-celda-export.util.ts` (nuevo), `src/common/exports/excel/excel.exporter.ts`, `src/common/exports/csv/csv.exporter.ts`.
- `ARCHITECTURE.md` (§7, §8).

**No se modificó**: ningún DTO público, ningún controller, ningún contrato HTTP existente (los 3 endpoints de exportación y los de Tiendas responden exactamente igual que antes salvo los 2 nuevos casos de error explícitamente pedidos: `400` por exceso de filas y `409` por RUC duplicado, ambos ya contemplados en el contrato de errores estándar del proyecto), `tiendas.service.ts`, `tiendas.importador.ts`, `JsonExporter`, `XmlExporter`, `PdfExporter`.

## Fase 26 — Corrección de 8 de los 9 hallazgos ALTOS de la Auditoría (proyecto Fase 29)

Continuación de la Fase 25 (críticos): corrige A2, A4, A5, A6, A8, A9, A11, A13 de la auditoría integral. **A3 (eliminar `PerfilMotorizado.estado`) se excluyó de esta fase** — ver nota al final. A1, A7, A10 y A12 quedaron fuera de alcance explícitamente (JWT, validaciones asociadas a JWT, zip bomb pendiente de validación, testing automatizado).

### A2 — Bloquear reasignación según estado del pedido

Nueva constante `ESTADOS_NO_REASIGNABLES = [entregado, cancelado, rechazado]` (`interfaces/flujo-pedido-repository.interface.ts`, mismo patrón que `ESTADOS_CANCELABLES` ya existente). `FlujoPedidoService.reasignarMotorizado` valida contra ella antes de la transacción (mensaje claro); `FlujoPedidoRepository.reasignarMotorizado` agrega `estado: { notIn: ESTADOS_NO_REASIGNABLES }` a la precondición atómica del `updateMany` ya existente — misma transacción, sin ninguna transacción nueva. Verificado: reasignación válida en estado `asignado` (201), rechazada en `entregado`/`cancelado`/`rechazado` (409 en los 3 casos, con mensaje especificando el estado actual).

### A3 — EXCLUIDO de esta fase (decisión explícita)

El hallazgo original asumía que `PerfilMotorizado.estado` "no es consultado, no es actualizado, no afecta ningún flujo" — cierto únicamente para la lógica de negocio de `flujo-pedido`. Verificado antes de tocar nada: el **Frontend usa activamente este campo** — es obligatorio en el formulario de Crear/Editar Motorizado (`motorizado-form.ts`), se muestra como badge filtrable en la tabla de Motorizados (`motorizados.page.ts`), y es una columna del Reporte de Motorizados. Eliminarlo del backend habría roto esas 3 pantallas sin que esta fase (explícitamente solo de Backend) autorizara corregirlas. Se consultó al usuario antes de proceder; se decidió **no eliminar el campo** en esta fase. Cero cambios de schema, DTOs, servicios o repositorios de `perfiles-motorizados` en esta fase.

### A4 — Cambio de rol bloqueado si existe perfil de motorizado

Nuevo método `IUsuariosRepository.tienePerfilMotorizado(usuarioId)` (`usuarios.repository.ts`), implementado con una consulta directa a `perfil_motorizado` — mismo patrón ya usado por `ReportesRepository` para leer tablas de otros módulos sin pasar por su service, necesario aquí para **no crear una dependencia circular** (`perfiles-motorizados` ya depende de `usuarios`, nunca al revés). `UsuariosService.actualizar` lo verifica únicamente cuando `dto.rol` difiere del rol actual (un `PATCH` que no cambia el rol, o que lo "cambia" al mismo valor, nunca dispara la validación). Verificado: cambio de rol con perfil asociado → 409; mismo usuario actualizando otro campo → 200; usuario sin perfil cambiando de rol en cualquier dirección → 200 (sin falsos positivos).

### A5 — Rate limiting en login/register

`@nestjs/throttler` (nueva dependencia, única para este fin) registrado **exclusivamente en `AuthModule`** — nunca como `APP_GUARD` global, para no afectar ningún otro endpoint. `ThrottlerGuard` es un provider normal de ese módulo; `AuthController` lo activa explícitamente vía `@UseGuards(ThrottlerGuard)` + `@Throttle({ auth: {} })` únicamente en `POST /auth/login` y `POST /auth/register`. Límite: 5 solicitudes / 60 segundos (constantes `LIMITE_SOLICITUDES_AUTH`/`VENTANA_LIMITE_AUTH_MS`, única fuente de estos valores). Verificado en vivo: 6 intentos consecutivos de login → los primeros 5 responden normalmente (401 por credenciales inválidas), el 6.º responde `429`; mismo patrón en register (5×`201`, 6.º `429`); 10 solicitudes consecutivas a `GET /pedidos` (endpoint no relacionado) → las 10 responden `200`, confirmando que el resto de la API no se vio afectada.

### A6 — Swagger condicional a `NODE_ENV`

`main.ts`: todo el bloque de `DocumentBuilder`/`SwaggerModule.setup` (y su log de arranque) ahora está condicionado a `nodeEnv !== 'production'`. Verificado: con `NODE_ENV=production`, `GET /api/docs` responde `404` y el resto de la API (`GET /pedidos`) sigue respondiendo `200` con normalidad; con `NODE_ENV=development` (default), Swagger sigue visible exactamente igual que antes.

### A8 — Validación de firma binaria (magic bytes)

Nueva utilidad compartida `common/utils/firma-archivo.util.ts` (`esImagenWebp`, `esArchivoZip`) — sin librerías nuevas, verificación manual de los primeros bytes del buffer. Aplicada en `foto-entrega.validator.ts` (además del `Content-Type` ya validado, ahora también se exige la firma `RIFF....WEBP` real) y en `ImportacionesService` (nuevo método privado `validarFirmaArchivo`, exige firma ZIP `PK` cuando `formato === 'xlsx'`; `json`/`xml` no tienen firma binaria propia, así que se dejan sin cambios — sus lectores ya rechazan contenido malformado al parsear). Verificado: un archivo con `Content-Type: image/webp` pero contenido de texto plano → `400` ("firma binaria incorrecta"); el mismo request con una cabecera `RIFF`/`WEBP` real → `201`; un `.xlsx` falso (texto plano con extensión/mimetype de xlsx) → `400`; la plantilla oficial real (`.xlsx` genuino) → procesa normalmente.

### A9 — Máximo 5 fotografías en Confirmar Entrega

Nueva constante `FOTO_ENTREGA_CANTIDAD_MAXIMA = 5` (`foto-entrega.validator.ts`, junto a las demás constantes de este dominio), pasada como segundo parámetro (`maxCount`) de `FilesInterceptor` en `flujo-pedido.controller.ts` (antes era `undefined`, sin ningún tope). Verificado: 1 foto → `201`; exactamente 5 fotos → `201`; 6 fotos → `400` (Multer/Nest ya traduce automáticamente la violación de `maxCount` a un `400` controlado, sin exponer ningún detalle interno). El mensaje por defecto de esa traducción ("Unexpected field") se dejó tal cual — ya es un `400` claro y controlado; personalizarlo habría requerido un filtro de excepciones nuevo, desproporcionado para una mejora puramente cosmética fuera del pedido explícito de esta fase.

### A11 — Sucursales exige Tienda activa

`SucursalesService`: nuevo método privado `validarTiendaActiva(tiendaId)` (reutiliza `TiendasService.buscarPorId`, que ya lanza `404` si no existe/está eliminada; agrega el chequeo de `activo`), usado tanto en `crear` como en `actualizar` (cuando se cambia `tiendaId`). Verificado: crear sucursal en tienda activa → `201`; crear en tienda desactivada → `409`; actualizar una sucursal para moverla a una tienda desactivada → `409`; actualizar otro campo sin tocar `tiendaId` → `200` sin verse afectado.

### A13 — `@MaxLength` en los 5 `ListQueryDto` señalados

`ListClientesQueryDto` (`nombre` 150, `telefono` 20, `documentoIdentidad` 20), `ListTiendasQueryDto` (`nombre` 150), `ListSucursalesQueryDto` (`nombre` 150), `ListUsuariosQueryDto` (`usuario` 50, `correo` 150), `ListPerfilesMotorizadosQueryDto` (`placa` 15) — cada límite es exactamente el mismo ya definido en el `Create*Dto` hermano del campo equivalente. Verificado: una búsqueda con un valor de 200 caracteres en cada uno de los 6 filtros → `400` en los 6; una búsqueda normal y corta → `200` sin cambios.

### Pruebas técnicas ejecutadas

`prisma validate` ✓ (sin cambios de schema en esta fase), `prisma generate` ✓, `tsc --noEmit` ✓, `eslint` ✓, `npm run build` ✓. Todas las pruebas funcionales de arriba se ejecutaron contra el servidor real corriendo (`start:dev`), incluida una reinicialización completa con `NODE_ENV=production` para A6. Los datos de prueba creados (pedidos, tiendas, sucursales, usuarios) se limpiaron al finalizar vía la propia API.

### Archivos modificados

- `src/modules/flujo-pedido/interfaces/flujo-pedido-repository.interface.ts`, `flujo-pedido.service.ts`, `flujo-pedido.repository.ts`, `flujo-pedido.controller.ts`.
- `src/modules/usuarios/interfaces/usuarios-repository.interface.ts`, `usuarios.repository.ts`, `usuarios.service.ts`.
- `src/modules/auth/auth.module.ts`, `auth.controller.ts` (+ nueva dependencia `@nestjs/throttler`).
- `src/main.ts`.
- `src/common/utils/firma-archivo.util.ts` (nuevo).
- `src/modules/fotos-entrega/foto-entrega.validator.ts`.
- `src/modules/importaciones/importaciones.service.ts`.
- `src/modules/sucursales/sucursales.service.ts`.
- `src/modules/clientes/dto/list-clientes-query.dto.ts`, `src/modules/tiendas/dto/list-tiendas-query.dto.ts`, `src/modules/sucursales/dto/list-sucursales-query.dto.ts`, `src/modules/usuarios/dto/list-usuarios-query.dto.ts`, `src/modules/perfiles-motorizados/dto/list-perfiles-motorizados-query.dto.ts`.
- `ARCHITECTURE.md`.

**No se modificó**: schema de Prisma, ninguna migración, ningún DTO público de entrada/salida (los `ListQueryDto` solo ganaron una restricción más estricta sobre el mismo campo ya opcional), ningún contrato HTTP (los nuevos códigos de estado — `409`, `429`, `400` — corresponden todos a validaciones de negocio ya contempladas en el patrón de errores estándar del proyecto, no a rutas ni formas de respuesta nuevas), `PerfilMotorizado.estado` (A3, excluido), y ningún archivo de Frontend.

## Fase 27 — Corrección de los 3 hallazgos BAJOS de la Auditoría (proyecto Fase 30)

Cierre de la auditoría integral (proyecto Fase 27): corrige B3, B6, B7. **B1, B2, B4, B5, B8, B9 quedaron fuera de alcance explícitamente.** Sin cambios de schema, sin migraciones, sin cambios de contrato HTTP.

### B3 — `import 'reflect-metadata'` explícito en `main.ts`

Se agregó `import 'reflect-metadata';` como primera línea del archivo (antes de cualquier otro import), con un comentario explicando el motivo: la dependencia ya se cargaba de forma transitoria (arrastrada implícitamente por alguna dependencia del framework) y nunca falló, pero depender de ese arrastre implícito es frágil ante una futura actualización de Nest/TypeScript. `reflect-metadata` ya era una dependencia directa del proyecto (`package.json`), así que no se instaló nada nuevo. Verificado: arranque idéntico, sin ningún cambio de comportamiento observable (decoradores de `class-validator`, Prisma y NestJS siguen funcionando exactamente igual).

### B6 — Evaluación del constructor duplicado en DTOs de respuesta (decisión: mantener)

Se evaluó, sin modificar código, si centralizar el constructor `constructor(partial) { Object.assign(this, partial); }` (idéntico en 13 DTOs de respuesta) en una clase base o utilidad común valía la pena. Confirmado técnicamente que una base genérica autorreferenciada (`class Foo extends ResponseDto<Foo>`) sería compatible con Swagger (que lee `@ApiProperty` vía reflexión de prototipos, no depende de la clase base) y con la serialización actual (los DTOs se construyen manualmente en los mappers, no vía `class-transformer`). Sin embargo, **se decidió no refactorizar**: el ahorro real es de ~2 líneas netas por archivo, a cambio de introducir un patrón de OOP genérico (self-referencing generic) más abstracto que el código actual de 3 líneas — exactamente el tipo de complejidad que este proyecto evita de forma consistente en favor de simplicidad. Cero archivos modificados para B6; los 13 DTOs conservan su constructor actual.

### B7 — Scripts auxiliares versionados y documentados

Se reconstruyeron y se incorporaron al repositorio, en `scripts/` (nunca ejecutados nuevamente), los 2 scripts puntuales usados en fases anteriores y descartados tras su uso único:

- `scripts/backfill/backfill-codigo-pedido.ts` — recálculo de `Pedido.codigoPedido` al formato `PED-AAAA-NNNNNN` (Fase 22/24), reutiliza `PedidoCodigoGenerator` real, idempotente.
- `scripts/templates/build-plantillas-importacion.ts` — generación de las 3 plantillas `.xlsx` oficiales del Centro de Importaciones (Fase 24/26), mismo estilo visual y contenido ya documentado en esa fase.

`scripts/README.md` (nuevo) documenta el propósito de cada script, su carácter de "ejecutado una única vez, no forma parte de ningún flujo automático", y cómo reproducirlo si hiciera falta. `tsconfig.build.json` ganó `"scripts"` en su `exclude` (además de `tsconfig.json` base, que sí los type-checkea para soporte de IDE) — sin este ajuste, `nest build` compilaba `scripts/` dentro de `dist/`, contaminando el artefacto de producción con código de mantenimiento que nunca debe ejecutarse en ese contexto.

### Pruebas realizadas

- **B3**: backend reiniciado con la nueva línea → arranque limpio, sin errores, mismos módulos/rutas mapeadas que antes.
- **B6**: sin cambios de código; no aplica prueba funcional adicional (se verificó por inspección que los 13 DTOs mantienen el patrón actual).
- **B7**: `npm run build` → `dist/` no contiene ningún archivo de `scripts/` (verificado explícitamente); `tsc --noEmit` sobre el proyecto completo (incluyendo `scripts/`) → sin errores; `eslint` sobre `src/**/*.ts` y `scripts/**/*.ts` → sin errores.
- General: servidor iniciado con `start:dev` → arranque exitoso, `GET /api/docs` (Swagger) → `200`; `GET /usuarios` y `GET /tiendas` → `200`, con la serialización de sus DTOs de respuesta idéntica a la esperada (confirmando que B3 y B6 no alteraron ningún comportamiento observable).
- `prisma validate` ✓, `prisma generate` ✓, `tsc --noEmit` ✓, `eslint` ✓, `npm run build` ✓.

### Archivos modificados

- `src/main.ts` (B3).
- `scripts/backfill/backfill-codigo-pedido.ts` (nuevo), `scripts/templates/build-plantillas-importacion.ts` (nuevo), `scripts/README.md` (nuevo) (B7).
- `tsconfig.build.json` (B7).
- `ARCHITECTURE.md`.

**No se modificó**: `prisma/schema.prisma`, ninguna migración, ningún DTO de respuesta (B6, decisión explícita de mantener el código actual), ningún controller/service/repository de ningún módulo de negocio, ningún archivo de Frontend.

## Fase 28 — Corrección de hallazgos funcionales de la Auditoría Final de Certificación (proyecto Fase 32)

Corrige N1, N2, N4, N5, N6 de los 7 hallazgos nuevos detectados en la auditoría de certificación (proyecto Fase 31). **N3 (estados `devuelto`/`reprogramado` inalcanzables) y N7 (configuración del pool de conexiones) quedan expresamente fuera** — el primero es una decisión de negocio, el segundo una decisión de infraestructura, ninguna de las dos corresponde a esta fase. Sin cambios de schema, sin migraciones, sin cambios de contrato HTTP existente (los nuevos códigos `400`/`409` son casos de error ya contemplados por el patrón estándar del proyecto).

### N1 — Bloquear pagos sobre pedidos en estado terminal

`PagosService.registrar` ahora valida `pedido.estado` antes de crear el pago, reutilizando `ESTADOS_CANCELABLES` (`modules/flujo-pedido/interfaces/flujo-pedido-repository.interface.ts`) — la misma definición de "estados activos" que ya usa `flujo-pedido`, sin mantener una segunda lista. Un pedido fuera de esos 4 estados (`entregado`, `cancelado`, `rechazado`, `devuelto`, `reprogramado`, `cliente_ausente`) responde `409 Conflict`.

Se incluye deliberadamente `entregado` en el bloqueo: se verificó contra `Frontend/src/pages/rider/mis-pedidos/mis-pedidos.page.ts` (`openConfirmarEntregaModal`) que el Motorizado siempre registra los pagos pendientes **antes** de llamar a `confirmarEntrega` (Fase 20.1: "el cobro ocurre recién cuando el Motorizado entrega el pedido al cliente") — para cuando un pedido llega a `entregado`, sus pagos ya deberían estar completos, así que bloquear pagos nuevos en ese estado no afecta el flujo real y cierra el mismo vacío para los 5 estados terminales restantes con una sola condición.

### N2 — Bloquear eliminación de `PerfilMotorizado` con pedidos activos

Nuevo método `IPerfilesMotorizadosRepository.tienePedidosActivos(perfilId)` (`perfiles-motorizados.repository.ts`), con una consulta directa a la tabla `pedido` (mismo patrón ya usado por `UsuariosRepository.tienePerfilMotorizado`, Fase 29/A4, para evitar inyectar `PedidosService` y crear un ciclo de DI) — `estado: { in: ESTADOS_CANCELABLES }` filtrado por `motorizadoActualId`, misma constante reutilizada que en N1. `PerfilesMotorizadosService.eliminar` la consulta antes de intentar el borrado y responde `409 Conflict` si el perfil tiene algún pedido activo asignado. **No se tocó la relación Prisma ni su `onDelete: SetNull`** (instrucción explícita de esta fase) — la validación ocurre enteramente en la capa de aplicación, antes de que Prisma intente el `DELETE`.

### N4 — `@MaxLength(30)` en `ListPedidosQueryDto.codigoPedido`

Mismo límite ya usado por `codigoPedido VarChar(30)` (schema) y por la corrección A13 (Fase 29) en el resto de `ListQueryDto` del proyecto — Pedidos había quedado fuera de esa corrección original.

### N5 — `@Min(0)` en `CreatePedidoDto.valorProducto`/`costoEnvio`

Ambos campos, antes sin cota inferior, ahora rechazan valores negativos con `400`. `UpdatePedidoDto` (`PartialType(OmitType(CreatePedidoDto, ...))`) hereda la validación automáticamente, sin tocarlo.

### N6 — Cota superior en `CrearPagoDto.monto`/`montoRecibido`

Nueva constante `MONTO_MAXIMO = 99_999_999.99` (`crear-pago.dto.ts`), igual a la capacidad máxima de la columna `Decimal(10,2)` de `Pago`. Antes de esta corrección, un valor por encima de ese límite pasaba `class-validator` y fallaba recién en Prisma, devuelto como `500` genérico por el filtro global de excepciones; ahora se rechaza en la capa de validación con `400`, antes de llegar al repositorio.

### Pruebas realizadas (contra el servidor real, `start:dev`)

- **N1**: pago sobre pedido cancelado → `409`; sobre pedido rechazado → `409`; sobre pedido `asignado` (activo) → `201`; adicionalmente, sobre pedido `entregado` → `409` (verificación extra, consistente con la decisión de incluir `entregado` en el bloqueo). `devuelto` no se pudo reproducir end-to-end (estado inalcanzable, N3 fuera de alcance) — cubierto por la misma condición genérica (`!ESTADOS_CANCELABLES.includes(...)`), sin caso especial para ningún valor puntual.
- **N2**: perfil de motorizado de prueba con un pedido `asignado` → `DELETE` responde `409` ("tiene pedidos activos asignados"); perfil de prueba sin pedidos → `DELETE` responde `200`.
- **N4**: `GET /pedidos?codigoPedido=` con 31 caracteres → `400`; con exactamente 30 (límite) → `200`.
- **N5**: `valorProducto: -5` → `400`; `costoEnvio: -10` → `400`; `valorProducto: 0` (límite) → `201`.
- **N6**: `monto: 100000000` → `400`; `montoRecibido: 100000000` → `400`; `monto: 99999999.99` (límite exacto) → `201`, sin ningún `500` en ningún caso.
- `prisma validate` ✓ (sin cambios de schema), `prisma generate` ✓, `tsc --noEmit` ✓, `eslint` ✓, `npm run build` ✓.

### Archivos modificados

- `src/modules/pagos/pagos.service.ts` (N1).
- `src/modules/perfiles-motorizados/interfaces/perfiles-motorizados-repository.interface.ts`, `perfiles-motorizados.repository.ts`, `perfiles-motorizados.service.ts` (N2).
- `src/modules/pedidos/dto/list-pedidos-query.dto.ts` (N4).
- `src/modules/pedidos/dto/create-pedido.dto.ts` (N5).
- `src/modules/pagos/dto/crear-pago.dto.ts` (N6).
- `ARCHITECTURE.md`.

**No se modificó**: `prisma/schema.prisma`, ninguna migración, ninguna relación `onDelete` de Prisma, ningún DTO de respuesta, ningún contrato HTTP existente (los nuevos `400`/`409` son casos de error ya contemplados por el patrón estándar del proyecto), N3 (`EstadoPedido.devuelto`/`reprogramado`) ni N7 (pool de conexiones) — ambos expresamente fuera de esta fase.

## Fase 29 — Rediseño del ciclo de vida de Usuarios y Motorizados (proyecto Fase 33)

Rediseña el ciclo de vida de `Usuario`/`PerfilMotorizado` para preservar la integridad histórica del sistema: el historial de negocio es inmutable, ningún usuario con participación operativa puede eliminarse (solo desactivarse). Alcance conjunto Backend + Frontend + Base de Datos.

### Parte 1 — Eliminar únicamente usuarios sin historial

Nuevo `UsuariosRepository.tieneHistorial(usuarioId)`: verifica en paralelo (`Promise.all`) las 5 relaciones con `onDelete: Restrict` hacia `Usuario` en el schema — `pedidosCreados`, `eventosHistorial` (`historial_pedido`), `pagosRegistrados`, `importaciones` (`ImportacionHistorial`), y `perfilMotorizado` (reutilizando `tienePerfilMotorizado`, ya existente desde la Fase 29/A4, sin duplicar la consulta). `UsuariosService.eliminar` la consulta antes de la eliminación lógica (`deletedAt`, ya existente) y responde `409 Conflict` si el usuario tiene cualquiera de esas 5 relaciones — el mensaje indica explícitamente usar la acción de desactivar.

### Parte 2 — Desactivación como mecanismo oficial

Sin cambios de código: `activar`/`desactivar` (`Usuario.activo`) ya existían desde fases anteriores y ya son el mecanismo correcto — esta parte formaliza su rol como la vía normal de salida de personal, reflejado en el Frontend (ver abajo).

### Parte 3 — Filtro por `activo` en Usuarios

Nuevo filtro opcional `activo?: boolean` en `ListUsuariosQueryDto`/`BuscarUsuariosParams`/`UsuariosRepository.buscarMuchos` — sin el filtro, se muestran activos e inactivos indistintamente (compatibilidad hacia atrás). Reutiliza el parser de query booleanas ya existente (`ListIncidentesQueryDto.resuelto`, Fase 12), extraído a `common/utils/parse-boolean-query-param.util.ts` para no duplicarlo una segunda vez.

### Parte 4 — Eliminación de `PerfilMotorizado.estado`

Confirmado (auditoría Fase 27/29, hallazgo A3): `estado` (`EstadoMotorizado`: disponible/ocupado/inactivo) nunca participó en ninguna regla de negocio de `flujo-pedido`. Eliminado por completo: columna + índice + enum en `prisma/schema.prisma` (migración `20260718031600_remove_perfil_motorizado_estado`), DTOs de creación/actualización/listado/respuesta, repositorio, servicio, mapper de `perfiles-motorizados`; `ReporteMotorizadoRow`/`ReporteMotorizadoItemDto`/columna de exportación del Reporte de Productividad; el importador de Motorizados (columna `estado` del archivo, `ImportarMotorizadoFilaDto`) y las 3 plantillas oficiales `.xlsx` regeneradas (`scripts/templates/build-plantillas-importacion.ts` actualizado, columna "estado" retirada de la plantilla de Motorizados). El estado operativo real de un motorizado se deriva ahora exclusivamente de `Usuario.activo`.

### Parte 5 y 6 — Creación de Motorizados y reorganización de la pantalla (Frontend)

Ver `FRONTEND_PROGRESS.md` para el detalle completo. Resumen: el formulario de Usuarios ahora captura la placa inmediatamente cuando el rol es Motorizado (creación/edición de `Usuario` y `PerfilMotorizado` orquestada en el Frontend, sin nuevo endpoint); la pantalla independiente `/admin/motorizados` se retiró — sin `estado`, la única información propia de ese módulo era la placa, insuficiente para justificar un CRUD separado. `perfiles-motorizados` sigue existiendo intacto como recurso REST (usado por `flujo-pedido`, Importaciones y Reportes).

### Parte 7 — Integridad histórica

Verificado empíricamente contra el servidor real: un `PerfilMotorizado` con un pedido activo asignado sigue devolviendo `nombres`/`apellidos`/`placa` completos en `GET /perfiles-motorizados/:id` y en `GET /reportes/motorizados` aun después de desactivar su `Usuario` — ninguna pantalla ni endpoint pierde la relación ni cae a mostrar un id crudo.

### Pruebas realizadas (contra el servidor real, `start:dev`)

- Usuario sin historial → `DELETE` responde `200`. Usuario con historial (pedidos creados) → `409`. Usuario con `PerfilMotorizado` asociado pero sin pedidos → `409` (perfil operativo cuenta como historial por sí solo). Usuario con `PerfilMotorizado` y un pedido activo asignado → `409`.
- `GET /usuarios?activo=true` / `?activo=false` → cada uno devuelve exactamente el subconjunto esperado.
- `POST /perfiles-motorizados` sin campo `estado` → `201`, respuesta sin ese campo.
- `PATCH /usuarios/:id/desactivar` sobre un motorizado con pedido activo asignado → `200`; el pedido y el reporte de productividad siguen resolviendo su nombre/placa completos, sin ningún id huérfano.
- `prisma validate` ✓, migración aplicada con `prisma migrate deploy` ✓, `prisma generate` ✓, `tsc --noEmit` ✓, `eslint` ✓, `npm run build` ✓ (Backend); `tsc --noEmit` ✓, `eslint` ✓, `vite build` ✓ (Frontend).

### Archivos modificados (Backend)

- `prisma/schema.prisma`, migración `prisma/migrations/20260718031600_remove_perfil_motorizado_estado/`.
- `src/common/utils/parse-boolean-query-param.util.ts` (nuevo).
- `src/modules/incidentes/dto/list-incidentes-query.dto.ts` (reutiliza el parser compartido).
- `src/modules/usuarios/interfaces/usuarios-repository.interface.ts`, `usuarios.repository.ts`, `usuarios.service.ts`, `dto/list-usuarios-query.dto.ts`.
- `src/modules/perfiles-motorizados/`: `interfaces/perfiles-motorizados-repository.interface.ts`, `perfiles-motorizados.repository.ts`, `perfiles-motorizados.service.ts`, `perfiles-motorizados.mapper.ts`, `perfiles-motorizados.controller.ts`, `dto/create-perfil-motorizado.dto.ts`, `dto/update-perfil-motorizado.dto.ts`, `dto/list-perfiles-motorizados-query.dto.ts`, `dto/perfil-motorizado-response.dto.ts`.
- `src/modules/reportes/`: `interfaces/reportes-repository.interface.ts`, `reportes.repository.ts`, `reportes.mapper.ts`, `reportes.service.ts`, `dto/reporte-motorizado-item.dto.ts`.
- `src/modules/importaciones/importadores/motorizados.importador.ts`, `dto/importar-motorizado-fila.dto.ts`.
- `scripts/templates/build-plantillas-importacion.ts` (plantilla de Motorizados sin columna "estado"), `src/modules/importaciones/plantillas/motorizados.xlsx` (regenerado).
- `ARCHITECTURE.md`.

**No se modificó**: ningún contrato HTTP existente más allá de lo explícitamente pedido (los endpoints de `perfiles-motorizados` siguen existiendo, solo sin el campo `estado`); ninguna regla de negocio de `flujo-pedido`; `PerfilMotorizado.usuarioId`/relaciones `onDelete` (excepto la columna `estado` retirada, que no era una relación).
