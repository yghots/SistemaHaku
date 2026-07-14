# Arquitectura — HAKU Courier Backend

## 1. Stack

- **NestJS 11** (TypeScript, decoradores, inyección de dependencias)
- **Prisma ORM 7** sobre **MySQL**, con `@prisma/adapter-mariadb` como driver adapter (Prisma 7 quitó `url` del datasource; la conexión se inyecta en runtime vía `ConfigService`)
- **class-validator** / **class-transformer** para validación y transformación de DTOs
- **@nestjs/swagger** para documentación OpenAPI
- **argon2** para hashing de contraseñas
- **helmet**, **compression** como middleware de `main.ts`

No hay JWT, guards ni sistema de roles implementado todavía — es una decisión explícita, diferida desde el inicio del proyecto, no un olvido.

## 2. Estructura de carpetas

```
src/
  app.module.ts          Modulo raiz: registra ConfigModule + todos los modulos de negocio
  main.ts                Bootstrap: helmet, compression, CORS, versioning, ValidationPipe, filtros, Swagger
  app.controller.ts       Endpoint raiz de health check ("Hello World!")
  config/
    configuration.ts      Carga variables de entorno con defaults
    env.validation.ts     Valida el .env al arrancar (class-validator)
  common/
    dto/                  PaginationQueryDto, PaginatedResponseDto (reutilizados por todos los modulos)
    filters/               HttpExceptionFilter (formato de error uniforme)
    interceptors/          LoggingInterceptor (log de metodo/ruta/status/duracion)
    utils/                 assert-found.util.ts, prisma-error.util.ts (helpers compartidos, Fase 11)
  prisma/
    prisma.module.ts       Modulo global que expone PrismaService
    prisma.service.ts      Extiende PrismaClient, inyecta el adapter de MySQL, maneja conexion
  modules/
    usuarios/  auth/  tiendas/  sucursales/  clientes/  perfiles-motorizados/
    pedidos/  historial-pedido/  fotos-entrega/  flujo-pedido/  incidentes/  reportes/
```

Cada módulo de negocio sigue la misma forma interna:

```
modules/<nombre>/
  dto/                            DTOs de entrada (Create*/Update*/List*QueryDto) y salida (*ResponseDto)
  interfaces/<nombre>-repository.interface.ts   Token de DI + contrato del repositorio + tipos de datos internos
  <nombre>.controller.ts          HTTP: decoradores de ruta, Swagger, delega 100% al service
  <nombre>.service.ts             Reglas de negocio, validaciones, orquestacion entre modulos
  <nombre>.repository.ts          Unica clase que llama a PrismaService
  <nombre>.mapper.ts              Entidad Prisma -> ResponseDto (BigInt/Decimal -> string)
  <nombre>.module.ts              Cablea todo con @Module()
```

## 3. Arquitectura: Clean Architecture por capas

Cada módulo respeta una separación estricta de responsabilidades:

- **Controller**: solo mapea HTTP ⇄ llamadas al service. Nunca contiene lógica de negocio ni acceso a Prisma.
- **Service**: dueño de las reglas de negocio (validaciones, orden de operaciones, mensajes de error). Depende del repositorio **por interfaz**, nunca de la clase concreta.
- **Repository**: única capa que conoce Prisma. Implementa una interfaz (`IXxxRepository`) inyectada por *token* (`Symbol('XXX_REPOSITORY')`), nunca se inyecta la clase concreta directamente en el service.
- **Mapper**: clase estática sin estado, convierte entidades Prisma a DTOs de respuesta (conversión de `BigInt`/`Decimal` a `string` para serialización JSON segura).
- **DTOs**: `class-validator`/`class-transformer` decoran cada campo; el `ValidationPipe` global (`whitelist: true, forbidNonWhitelisted: true`) rechaza cualquier campo no declarado.

### Patrón de Inyección de Dependencias

```typescript
export const USUARIOS_REPOSITORY = Symbol('USUARIOS_REPOSITORY');
export interface IUsuariosRepository { /* ... */ }

@Injectable()
export class UsuariosService {
  constructor(
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuariosRepository: IUsuariosRepository, // interfaz, no la clase
  ) {}
}

@Module({
  providers: [
    UsuariosService,
    { provide: USUARIOS_REPOSITORY, useClass: UsuariosRepository }, // unico lugar que ata la implementacion
  ],
})
export class UsuariosModule {}
```

Esto es **Dependency Inversion** real: el service depende de una abstracción; la implementación concreta (Prisma) se resuelve solo en el `@Module()`. Permite sustituir el repositorio (tests, otro ORM) sin tocar el service.

## 4. Flujo de dependencias entre módulos

Grafo de imports de `@Module` — es un DAG estricto, sin ciclos:

```
usuarios ────────┬──> auth
                 └──> perfiles-motorizados ──┐
tiendas ──> sucursales ─────────────────────┤
clientes ────────────────────────────────────┼──> pedidos ──┬──> historial-pedido (solo lectura)
                                              │              ├──> fotos-entrega (solo lectura)
                                              │              ├──> flujo-pedido ──(+ perfiles-motorizados, usuarios)
                                              │              └──> incidentes ──(+ perfiles-motorizados)
reportes (sin imports de otros modulos, solo Prisma directo)
```

- `usuarios`, `tiendas` y `clientes` son las raíces (sin dependencias de otros módulos de negocio).
- `pedidos` es el módulo con más dependientes: todo lo que opera sobre el ciclo de vida de un pedido (historial, fotos, flujo, incidentes) depende de él para validar existencia.
- `reportes` es deliberadamente independiente: consulta Prisma directamente con `select` explícito en vez de reutilizar los servicios/mappers de otros módulos, porque necesita campos (`sucursal.tienda.nombre`) que el CRUD de Pedidos no expone.
- `flujo-pedido` concentra **todos** los casos de uso que cambian el estado de un pedido (Confirmar Recojo, Iniciar Ruta, Confirmar Entrega, Asignar/Reasignar Motorizado, Cliente Ausente, Rechazo, Cancelar) en un único módulo — decisión explícita del proyecto para no fragmentar la máquina de estados de `Pedido` en múltiples módulos.

## 5. Patrones de diseño usados

| Patrón | Dónde | Por qué |
|---|---|---|
| Repository | Toda capa de acceso a datos | Aísla Prisma del resto de la app; permite testear services con mocks del contrato |
| Dependency Inversion (tokens `Symbol`) | Todos los `*.module.ts` | El service nunca conoce la implementación concreta del repositorio |
| Mapper / DTO | Toda respuesta HTTP | Nunca se serializa una entidad Prisma directamente (evita fugas de columnas internas, resuelve `BigInt`/`Decimal`) |
| Static utility class | Todos los `*.mapper.ts` | Sin estado, sin necesidad de DI, invocación directa |
| Strategy implícita vía interfaz | `IXxxRepository` | Contrato explícito entre capa de negocio y de datos |
| Unit of Work (transacción) | `prisma.$transaction` en `flujo-pedido.repository.ts` y `pedidos.repository.ts` (creación con código transitorio) | Garantiza atomicidad cuando una operación escribe más de una tabla |
| Template method (informal) | `crearEventoHistorial` en `flujo-pedido.repository.ts` (Fase 11) | Centraliza el paso común (escribir `historial_pedido`) de 8 casos de uso que comparten forma pero difieren en el resto de la transacción |

## 6. Decisiones técnicas relevantes

- **IDs `BigInt`**: todas las PK son `BigInt` (autoincremental). Se serializan como `string` en cada DTO de respuesta vía `.toString()` en el mapper — necesario porque `JSON.stringify` no soporta `bigint` nativamente.
- **Eliminación lógica vs física**: `Usuario`, `Tienda`, `Sucursal` y `Cliente` tienen `deletedAt` (soft delete). `PerfilMotorizado`, `Pedido`, `HistorialPedido`, `FotoEntrega` e `Incidente` **no** tienen `deletedAt` — se eliminan físicamente donde el caso de uso lo permite (decisión documentada por fase en `DEVELOPMENT_PROGRESS.md`).
- **`codigoPedido = id.toString()`**: al no existir un formato de código definido en la documentación funcional, se decidió (Fase 7, con aprobación explícita) usar el mismo id autoincremental como código público. Esto exige un valor transitorio único durante el `create` (el id no se conoce hasta el insert) que se corrige en la misma transacción.
- **`flujo-pedido` como máquina de estados centralizada**: todas las transiciones de `EstadoPedido` (incluida la cancelación, Fase 10) viven en un único módulo con un patrón repetido de "validar precondición → transacción con update + evento de historial". Fase 11 extrajo la parte común de ese patrón sin tocar las precondiciones de cada caso de uso.
- **`reportes` de solo lectura, sin transacciones**: al no escribir datos, no usa `$transaction`; sus tres endpoints hacen `select` explícito y agregaciones con `groupBy` para evitar N+1 al calcular métricas por motorizado.
- **Sin JWT/autenticación por token**: todos los endpoints que necesitan saber "quién realiza la acción" (`creadoPorId`, `usuarioId`, `motorizadoId`) lo reciben explícito en el body o como filtro, porque no hay sesión de la que inferirlo. Es una limitación conocida y deliberada, no un descuido.

## 7. Manejo de errores

Filtro global (`HttpExceptionFilter`) intercepta toda excepción y devuelve un formato uniforme:

```json
{ "statusCode": 404, "timestamp": "...", "path": "...", "method": "...", "message": "..." }
```

- `400`: `ValidationPipe` (DTO inválido) o `ParseIntPipe` (`:id` no numérico), o una regla de negocio puntual (ej. estado inválido en Reporte de Entregas).
- `401`: credenciales inválidas en login (mensaje genérico, no distingue usuario inexistente/inactivo/contraseña incorrecta, para evitar enumeración de usuarios).
- `404`: entidad no encontrada o eliminada lógicamente.
- `409`: conflicto de unicidad (nombre/correo/usuario duplicado), conflicto de estado (transición de `Pedido` no permitida) o violación de llave foránea al eliminar.
- Errores no controlados (500): se loguea el stack trace del lado del servidor únicamente; la respuesta al cliente nunca incluye detalles internos.

## 8. Configuración

`ConfigModule` global carga `configuration.ts` (defaults) y valida con `env.validation.ts` (class-validator sobre las variables de entorno) al arrancar — si la configuración es inválida, la aplicación no levanta. Variables: `NODE_ENV`, `PORT`, `API_PREFIX`, `API_VERSION`, `CORS_ORIGIN`, `DATABASE_URL`.
