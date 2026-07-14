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
    utils/                 assert-found.util.ts, prisma-error.util.ts (Fase 11), fetch-all-pages.util.ts (Fase 18)
    exports/               Infraestructura de exportacion de reportes (Fase 18, ver seccion 8)
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
- **Repository**: única capa que conoce Prisma. Implementa una interfaz (`IXxxRepository`) inyectada por _token_ (`Symbol('XXX_REPOSITORY')`), nunca se inyecta la clase concreta directamente en el service.
- **Mapper**: clase estática sin estado, convierte entidades Prisma a DTOs de respuesta (conversión de `BigInt`/`Decimal` a `string` para serialización JSON segura).
- **DTOs**: `class-validator`/`class-transformer` decoran cada campo; el `ValidationPipe` global (`whitelist: true, forbidNonWhitelisted: true`) rechaza cualquier campo no declarado.

### Patrón de Inyección de Dependencias

```typescript
export const USUARIOS_REPOSITORY = Symbol('USUARIOS_REPOSITORY');
export interface IUsuariosRepository {
  /* ... */
}

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

| Patrón                                       | Dónde                                                                                                             | Por qué                                                                                                                                                                                                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository                                   | Toda capa de acceso a datos                                                                                       | Aísla Prisma del resto de la app; permite testear services con mocks del contrato                                                                                                                                                                               |
| Dependency Inversion (tokens `Symbol`)       | Todos los `*.module.ts`                                                                                           | El service nunca conoce la implementación concreta del repositorio                                                                                                                                                                                              |
| Mapper / DTO                                 | Toda respuesta HTTP                                                                                               | Nunca se serializa una entidad Prisma directamente (evita fugas de columnas internas, resuelve `BigInt`/`Decimal`)                                                                                                                                              |
| Static utility class                         | Todos los `*.mapper.ts`                                                                                           | Sin estado, sin necesidad de DI, invocación directa                                                                                                                                                                                                             |
| Strategy implícita vía interfaz              | `IXxxRepository`                                                                                                  | Contrato explícito entre capa de negocio y de datos                                                                                                                                                                                                             |
| Unit of Work (transacción)                   | `prisma.$transaction` en `flujo-pedido.repository.ts` y `pedidos.repository.ts` (creación con código transitorio) | Garantiza atomicidad cuando una operación escribe más de una tabla                                                                                                                                                                                              |
| Template method (informal)                   | `crearEventoHistorial` en `flujo-pedido.repository.ts` (Fase 11)                                                  | Centraliza el paso común (escribir `historial_pedido`) de 8 casos de uso que comparten forma pero difieren en el resto de la transacción                                                                                                                        |
| Concurrencia optimista (update condicionado) | `actualizarPedidoCondicional` en `flujo-pedido.repository.ts` (Fase 13 del backend / Fase 15 del proyecto)        | Cierra la condición de carrera entre "validar precondición" y "escribir": el `UPDATE` de cada transición filtra por `id` **y** por la precondición de negocio (estado esperado, o motorizado actual esperado) en una sola sentencia atómica — ver detalle abajo |

## 6. Decisiones técnicas relevantes

- **IDs `BigInt`**: todas las PK son `BigInt` (autoincremental). Se serializan como `string` en cada DTO de respuesta vía `.toString()` en el mapper — necesario porque `JSON.stringify` no soporta `bigint` nativamente.
- **Eliminación lógica vs física**: `Usuario`, `Tienda`, `Sucursal` y `Cliente` tienen `deletedAt` (soft delete). `PerfilMotorizado`, `Pedido`, `HistorialPedido`, `FotoEntrega` e `Incidente` **no** tienen `deletedAt` — se eliminan físicamente donde el caso de uso lo permite (decisión documentada por fase en `DEVELOPMENT_PROGRESS.md`).
- **`codigoPedido = id.toString()`**: al no existir un formato de código definido en la documentación funcional, se decidió (Fase 7, con aprobación explícita) usar el mismo id autoincremental como código público. Esto exige un valor transitorio único durante el `create` (el id no se conoce hasta el insert) que se corrige en la misma transacción.
- **`flujo-pedido` como máquina de estados centralizada**: todas las transiciones de `EstadoPedido` (incluida la cancelación, Fase 10) viven en un único módulo con un patrón repetido de "validar precondición → transacción con update condicionado + evento de historial (+ fotos si aplica)". Fase 11 extrajo la parte común del registro de historial; la corrección de auditoría (backend Fase 13 / proyecto Fase 15) extrajo la parte común de la escritura condicionada (`actualizarPedidoCondicional`) sin tocar las precondiciones de negocio de cada caso de uso.
- **Condición de carrera en `flujo-pedido` — corregida (backend Fase 13 / proyecto Fase 15)**: antes de esta corrección, cada transición leía y validaba el estado del pedido _antes_ de abrir la transacción, y el `UPDATE` dentro de la transacción filtraba únicamente por `id` — dos solicitudes concurrentes sobre el mismo pedido podían pasar ambas la validación antes de que cualquiera escribiera, produciendo transiciones dobles/inconsistentes sin que el backend lo detectara (ver `AUDIT_REPORT.md`, hallazgo C1). La corrección usa concurrencia optimista: `tx.pedido.updateMany({ where: { id, <precondición> }, data })` — MySQL/InnoDB bloquea la fila coincidente y reevalúa el `WHERE` contra el valor ya comprometido, así que si otra transacción ya cambió esa precondición, `count` es `0` y se responde `409 Conflict` sin haber escrito nada (ni `historial_pedido` ni `fotos_entrega`). No se agregó bloqueo explícito (`SELECT ... FOR UPDATE`) ni una columna de versión: el propio `UPDATE ... WHERE` condicionado ya es atómico a nivel de fila. La validación previa a la transacción (`verificarEstado`/`verificarMotorizadoAsignado` en el service) se mantiene intacta como primer filtro rápido con un mensaje de error preciso para el caso normal (no-concurrente); la condición dentro de la transacción es la que garantiza la atomicidad real. `reasignarMotorizado` sigue sin validar el estado del pedido (inconsistencia de negocio ya documentada y dejada abierta a propósito, ver Fase 11/12 de este documento) — la corrección de concurrencia respeta exactamente esa misma semántica, condicionando el `UPDATE` por el motorizado actual esperado en vez de por un estado.
- **`reportes` de solo lectura, sin transacciones**: al no escribir datos, no usa `$transaction`; sus tres endpoints hacen `select` explícito y agregaciones con `groupBy` para evitar N+1 al calcular métricas por motorizado.
- **Sin JWT/autenticación por token — decisión deliberada, con requisito explícito antes de producción (revisado en la auditoría, proyecto Fase 14/15)**: todos los endpoints que necesitan saber "quién realiza la acción" (`creadoPorId`, `usuarioId`, `motorizadoId`) lo reciben explícito en el body o como filtro, porque no hay sesión de la que inferirlo. Esta sigue siendo una limitación conocida y deliberada, **no un bug** — pero la auditoría de la Fase 14 cuantificó su alcance real y debe quedar explícito aquí:
  - **Alcance**: afecta a todos los endpoints de `flujo-pedido` (asignar, reasignar, confirmar-recojo, iniciar-ruta, confirmar-entrega, cliente-ausente, rechazo, cancelar) y a cualquier otro endpoint que reciba un id de "quién actúa" en el body.
  - **Impacto**: cualquier cliente con acceso de red a la API puede leer `GET /pedidos/:id`, obtener el `motorizadoActualId`/ids relacionados, y luego invocar cualquier transición de ese pedido suministrando esos ids — no hay forma de que el backend verifique que quien hace la llamada HTTP es realmente ese usuario/motorizado.
  - **Limitación**: no existe ningún mecanismo de sesión, token ni autorización por rol en ningún endpoint del sistema actualmente.
  - **Requisito obligatorio antes de producción**: este proyecto **no debe desplegarse con datos ni usuarios reales** sin resolver esta limitación (implementar JWT + guards + roles) — o, como mitigación temporal estrictamente paliativa, sin restringir el acceso de red a la API a una red privada/VPN de confianza. Ver `TECH_DEBT.md` (sección 1) para el alcance de la implementación futura.

## 7. Infraestructura de exportación de reportes (Fase 18)

Capa agnóstica de reporte, agregada bajo `common/exports/` — ningún exportador conoce Pedidos/Entregas/Motorizados, solo un contrato genérico:

```typescript
interface ExportSolicitud {
  titulo: string;
  columnas: { clave: string; encabezado: string }[];
  filas: Record<string, string | number>[];
  filtros: Record<string, string>;
  generadoPor: string;
  generadoEn: Date;
}
interface ExportArchivo {
  buffer: Buffer;
  nombreArchivo: string;
  mimeType: string;
}
interface IExportador {
  exportar(solicitud: ExportSolicitud): Promise<ExportArchivo> | ExportArchivo;
}
```

- **Un exportador por formato** (`ExcelExporter`, `PdfExporter`, `CsvExporter`, `JsonExporter`, `XmlExporter`), los 5 implementan `IExportador` y viven en `common/exports/{excel,pdf,csv,json,xml}/`. `ExportService` (`common/exports/export.service.ts`) es el único punto de despacho: recibe el `FormatoExportacion` pedido y delega en el exportador correspondiente — ningún otro código del proyecto instancia un exportador directamente.
- **`ReportesService` nunca genera un archivo él mismo**: sus 3 métodos `exportarReporte{Pedidos,Entregas,Motorizados}` reutilizan exactamente el mismo método de repositorio (misma consulta Prisma) que su reporte visual homónimo, recorren todas las páginas con `fetchAllPages` (`common/utils/fetch-all-pages.util.ts`, mismo patrón que la utilidad equivalente del frontend), arman las filas planas con los mismos DTOs/Mapper ya existentes, y llaman a `ExportService.exportar(formato, solicitud)`. Cero lógica de generación de archivo fuera de `common/exports/`.
- **`ReportesController` solo fija los headers HTTP de descarga**: un único método privado `enviarArchivo()` (reutilizado por los 3 endpoints `/export`) setea `Content-Type`/`Content-Disposition` y devuelve un `StreamableFile` (vía `@Res({ passthrough: true })`, no un `@Res()` crudo, para no perder el pipeline de Nest — interceptors/filters siguen aplicando).
- **Nombre de archivo determinista**: `construirNombreArchivo()` (`export-filename.util.ts`) slugifica el título del reporte (sin tildes/mayúsculas) y le agrega un timestamp `YYYYMMDD-HHmmss`, ej. `reporte-de-pedidos_20260714-155729.xlsx`.
- **Librerías**: `exceljs` (Excel — título fusionado, metadata, encabezado con fondo, ancho de columna aproximado por contenido ya que no existe autoajuste real fuera del cliente), `pdfkit` (PDF — tabla dibujada a mano con paginación automática y numeración vía `bufferPages`/`bufferedPageRange`, técnica estándar de esta librería al no tener widget de tabla nativo), `xmlbuilder2` (XML — evita errores de escape manual). CSV y JSON se implementan a mano (sin dependencia nueva): CSV con BOM UTF-8 + separador `,` + escape RFC 4180, JSON con `JSON.stringify` sobre una envoltura `{ reporte, generadoPor, generadoEn, filtros, totalRegistros, datos }`.
- **CORS `exposedHeaders`**: `main.ts` expone `Content-Disposition` (`app.enableCors({ ..., exposedHeaders: ['Content-Disposition'] })`) — sin esto, el navegador oculta ese header a JavaScript aunque viaje en la respuesta, y el frontend no podría nombrar el archivo descargado con el nombre que decide el backend.
- **Sin cambios de esquema, de autenticación ni de reglas de negocio**: esta fase es puramente infraestructura de presentación de datos ya existentes; `generadoPor` sigue el mismo patrón sin-JWT que `creadoPorId`/`usuarioId` (sección 6).

## 8. Manejo de errores

Filtro global (`HttpExceptionFilter`) intercepta toda excepción y devuelve un formato uniforme:

```json
{
  "statusCode": 404,
  "timestamp": "...",
  "path": "...",
  "method": "...",
  "message": "..."
}
```

- `400`: `ValidationPipe` (DTO inválido) o `ParseIntPipe` (`:id` no numérico), o una regla de negocio puntual (ej. estado inválido en Reporte de Entregas).
- `401`: credenciales inválidas en login (mensaje genérico, no distingue usuario inexistente/inactivo/contraseña incorrecta, para evitar enumeración de usuarios).
- `404`: entidad no encontrada o eliminada lógicamente.
- `409`: conflicto de unicidad (nombre/correo/usuario duplicado), conflicto de estado (transición de `Pedido` no permitida, incluida la condición de carrera detectada dentro de la transacción — ver sección 6) o violación de llave foránea al eliminar.
- Errores no controlados (500): se loguea el stack trace del lado del servidor únicamente; la respuesta al cliente nunca incluye detalles internos — **este comportamiento estaba roto y se corrigió en la auditoría** (ver `AUDIT_REPORT.md`, hallazgo C2): antes de la corrección, `HttpExceptionFilter` devolvía `exception.message` para cualquier error que fuera una instancia de `Error` (es decir, prácticamente cualquier excepción no lanzada explícitamente por nuestro propio código, incluidos los errores de Prisma), filtrando texto interno al cliente. Ahora, para cualquier excepción que no sea un `HttpException` propio, el mensaje de respuesta es siempre el genérico `'Error interno del servidor'`, sin excepción — el detalle real solo se loguea del lado del servidor (`Logger.error`, con el `stack` completo). Los mensajes de los `HttpException` conocidos (400/401/403/404/409/422, todos lanzados deliberadamente por el propio código) no cambiaron.

## 9. Configuración

`ConfigModule` global carga `configuration.ts` (defaults) y valida con `env.validation.ts` (class-validator sobre las variables de entorno) al arrancar — si la configuración es inválida, la aplicación no levanta. Variables: `NODE_ENV`, `PORT`, `API_PREFIX`, `API_VERSION`, `CORS_ORIGIN`, `DATABASE_URL`.
