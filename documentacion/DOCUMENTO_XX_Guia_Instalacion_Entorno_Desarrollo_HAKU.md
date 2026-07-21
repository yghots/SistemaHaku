# Guía de Instalación del Entorno de Desarrollo — HAKU Courier

Guía oficial para levantar el proyecto **HAKU Courier** en una máquina nueva, desde el `git clone` hasta tener el Backend (NestJS) y el Frontend (Vite) funcionando y conectados a la base de datos MySQL.

Está escrita para que **cualquier desarrollador pueda dejar el sistema operativo sin consultar al autor**. Cada comando incluye: qué hace, cuándo ejecutarse y qué resultado esperar.

> **Alcance:** entorno de **desarrollo local**. El proyecto todavía **no está en producción** y **no incluye autenticación por JWT/roles** (decisión explícita del proyecto, ver `documentacion/backend/ARCHITECTURE.md` §1). Nada de esta guía asume datos previos: se parte de una base de datos vacía.

---

## 1. Requisitos previos

Antes de empezar, la máquina debe cumplir:

- **Sistema operativo:** macOS, Linux o Windows (con WSL2 recomendado en Windows).
- **Acceso a una terminal** (`bash`/`zsh` o PowerShell).
- **Conexión a internet** para descargar dependencias de npm.
- **Permisos** para instalar software (Node.js, Docker/MySQL) y para escribir en el directorio donde se clonará el repositorio.
- **Un servidor MySQL 8 accesible** (local, en Docker, o remoto). En esta guía se usa Docker como método recomendado (ver sección 7).

**Conocimientos asumidos:** uso básico de terminal, `git` y `npm`. No se requiere experiencia previa con NestJS, Prisma ni Vite.

---

## 2. Software requerido

El proyecto es un monorepo ligero con dos aplicaciones independientes (`Backend/` y `Frontend/`), cada una con su propio `package.json`. Se necesita:

| Software | Versión de referencia | Para qué se usa | Cómo verificar |
| --- | --- | --- | --- |
| **Node.js** | 22.x (probado con `v22.23.1`) | Ejecutar Backend y Frontend | `node -v` |
| **npm** | 10.x (probado con `10.9.8`) | Gestor de paquetes (ambas apps usan `package-lock.json`) | `npm -v` |
| **Git** | 2.x o superior | Clonar el repositorio | `git --version` |
| **MySQL** | 8.x (probado con MySQL 8.4) | Base de datos del Backend | `mysql --version` (o vía Docker) |
| **Docker** *(opcional pero recomendado)* | Cualquier versión reciente | Levantar MySQL 8 sin instalarlo en el sistema | `docker --version` |

> **Nota:** los `package.json` **no declaran un campo `engines`**, por lo que npm no bloqueará versiones distintas. Aun así, se recomienda Node 22.x para reproducir el entorno probado. Node 20.x LTS debería funcionar, pero no es la versión verificada.

Comando para verificar todo de una vez:

```bash
node -v && npm -v && git --version && docker --version
```

- **Cuándo:** antes de clonar, para confirmar que el entorno base está listo.
- **Resultado esperado:** cada comando imprime una versión. Si alguno falla con "command not found", instala ese software antes de continuar.

---

## 3. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO> SistemaHaku
cd SistemaHaku
```

- **Qué hace:** descarga el código completo del proyecto en la carpeta `SistemaHaku/`.
- **Cuándo:** una sola vez, al inicio.
- **Resultado esperado:** al ejecutar `ls` (o `dir` en Windows) debes ver esta estructura en la raíz:

```
SistemaHaku/
  Backend/          → API NestJS + Prisma + MySQL
  Frontend/         → SPA Vite + TypeScript (vanilla)
  documentacion/    → documentación oficial del proyecto
  package.json      → metadata mínima de la raíz (no es la app)
```

> **Importante:** la raíz **no es la aplicación**. Nunca se ejecuta `npm run start` desde la raíz. Todo se hace **dentro de `Backend/` o `Frontend/`** por separado.

---

## 4. Configuración del Backend

El Backend vive en `Backend/` y usa **NestJS 11 + Prisma 7 (MySQL)**.

### 4.1. Instalar dependencias

```bash
cd Backend
npm install
```

- **Qué hace:** instala todas las dependencias del Backend declaradas en `Backend/package.json` (NestJS, Prisma, argon2, class-validator, etc.) dentro de `Backend/node_modules/`.
- **Cuándo:** después de clonar, y cada vez que cambie `package.json`/`package-lock.json`.
- **Resultado esperado:** termina con un mensaje tipo `added N packages`. Es normal ver algunos `npm warn deprecated` (no son errores). Puede aparecer un aviso de vulnerabilidades moderadas: no bloquea el desarrollo local.

> **Nota:** durante la instalación, `@prisma/client` ejecuta un `postinstall` que puede requerir generar el cliente. Si por algún motivo no se generó, la sección 9 lo cubre explícitamente.

---

## 5. Configuración del archivo `.env`

El Backend **no arranca sin su archivo `.env`**: al iniciar, valida las variables de entorno con `class-validator` (`src/config/env.validation.ts`) y **si falta o es inválida alguna, la aplicación no levanta**.

El repositorio incluye un **`Backend/.env.example`** como plantilla. El archivo `.env` real **no se versiona** (está en `.gitignore`), por eso hay que crearlo en cada máquina.

### 5.1. Crear el `.env` a partir del ejemplo

```bash
# Dentro de Backend/
cp .env.example .env
```

- **Qué hace:** copia la plantilla a un archivo `.env` real y editable.
- **Cuándo:** una sola vez por máquina, después de instalar dependencias.
- **Resultado esperado:** existe `Backend/.env`. Aún debes editar `DATABASE_URL` (siguiente paso).

### 5.2. Variables del Backend (referencia real de `.env.example`)

| Variable | Obligatoria | Ejemplo | Significado |
| --- | --- | --- | --- |
| `NODE_ENV` | Sí | `development` | Entorno de ejecución (`development` \| `production` \| `test`). En `development` se habilita Swagger. |
| `PORT` | Sí | `3000` | Puerto HTTP del Backend. |
| `API_PREFIX` | Sí | `api` | Prefijo global de todas las rutas. |
| `API_VERSION` | Sí | `1` | Versión de la API en la URL (`/api/v1`). |
| `CORS_ORIGIN` | Sí | `http://localhost:5173` | Origen(es) permitidos para CORS. **Debe coincidir con la URL del Frontend.** Admite varios separados por coma. |
| `DATABASE_URL` | Sí | ver abajo | Cadena de conexión a MySQL. |

### 5.3. Formato de `DATABASE_URL`

```
DATABASE_URL="mysql://USUARIO:PASSWORD@HOST:PUERTO/NOMBRE_BD?allowPublicKeyRetrieval=true"
```

Ejemplo para una base local llamada `haku_courier` con MySQL en Docker (usuario `root`):

```
DATABASE_URL="mysql://root:TU_PASSWORD@localhost:3306/haku_courier?allowPublicKeyRetrieval=true"
```

- **`?allowPublicKeyRetrieval=true`** es necesario con el plugin de autenticación por defecto de MySQL 8 (`caching_sha2_password`) cuando el driver no tiene cacheada la clave RSA del servidor (por ejemplo, tras recrear el contenedor). Sin él, la conexión puede fallar con `RSA public key is not available client side`.
- Reemplaza `TU_PASSWORD` y `haku_courier` por los valores reales de tu servidor MySQL (ver sección 7).

> **Nunca subas tu `.env` al repositorio ni compartas contraseñas en texto plano.** El `.env` está deliberadamente ignorado por git.

---

## 6. Configuración del Frontend

El Frontend vive en `Frontend/` y usa **Vite 8 + TypeScript (vanilla, sin framework SPA)**.

### 6.1. Instalar dependencias

```bash
# Desde la raíz del proyecto
cd Frontend
npm install
```

- **Qué hace:** instala las dependencias del Frontend (Vite, Tailwind CSS v4, Axios, SweetAlert2, Day.js, Lucide, etc.).
- **Cuándo:** después de clonar, y cuando cambie `package.json`.
- **Resultado esperado:** `added N packages`, típicamente sin vulnerabilidades.

### 6.2. Crear el `.env` del Frontend

El Frontend **también requiere un `.env`**. Su punto único de lectura de variables (`src/config/env.ts`) **lanza un error y no arranca** si falta `VITE_API_BASE_URL`. El repositorio incluye **`Frontend/.env.example`** como plantilla.

```bash
# Dentro de Frontend/
cp .env.example .env
```

Variables (referencia real de `Frontend/.env.example`):

| Variable | Obligatoria | Ejemplo | Significado |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | **Sí** (obligatoria, si falta el Frontend no arranca) | `http://localhost:3000/api/v1` | URL base de la API del Backend, **incluyendo prefijo y versión** (`/api/v1`). |
| `VITE_API_TIMEOUT_MS` | No (default `15000`) | `15000` | Timeout de las peticiones HTTP, en milisegundos. |
| `VITE_APP_NAME` | No (default `HAKU Courier`) | `HAKU Courier` | Nombre visible de la aplicación en el layout/título. |

- **Resultado esperado:** existe `Frontend/.env` con `VITE_API_BASE_URL` apuntando al Backend.

> **Consistencia clave:** `VITE_API_BASE_URL` (Frontend) debe apuntar al mismo host/puerto que sirve el Backend, y `CORS_ORIGIN` (Backend) debe coincidir con la URL donde corre el Frontend (`http://localhost:5173`). Si estos dos valores no concuerdan, el Frontend cargará pero las peticiones a la API serán bloqueadas por CORS (ver sección 13).

---

## 7. Configuración de la Base de Datos

El Backend necesita un **servidor MySQL 8** accesible en la URL definida en `DATABASE_URL`. El `.env.example` documenta el uso de un **contenedor Docker** como método esperado.

### 7.1. Opción recomendada — MySQL en Docker

Si no tienes un MySQL corriendo, esta es una forma estándar de obtener uno (adáptala a tus credenciales):

```bash
docker run --name mysql-db \
  -e MYSQL_ROOT_PASSWORD=TU_PASSWORD \
  -p 3306:3306 \
  -d mysql:8
```

- **Qué hace:** levanta un contenedor MySQL 8 escuchando en `localhost:3306`, con el usuario `root` y la contraseña que definas.
- **Cuándo:** una sola vez (luego se reutiliza con `docker start mysql-db`).
- **Resultado esperado:** `docker ps` muestra el contenedor `mysql-db` en estado `Up` con el puerto `3306` mapeado.

> El comando `docker run` de arriba es una receta estándar de Docker (no un script del repositorio); ajústalo a tu política de credenciales. Lo único que el proyecto exige es que `DATABASE_URL` apunte a un MySQL 8 alcanzable.

### 7.2. Creación de la base de datos

**No es necesario crear la base manualmente.** El comando de migración de la sección 8 (`prisma migrate dev`) **crea la base de datos automáticamente** si no existe y el usuario tiene privilegios suficientes.

Si prefieres crearla a mano de todos modos:

```sql
CREATE DATABASE IF NOT EXISTS haku_courier
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

- **Resultado esperado:** existe una base vacía llamada igual que en tu `DATABASE_URL` (`haku_courier` en los ejemplos).

---

## 8. Ejecución de la migración inicial

El esquema completo de la base vive en `Backend/prisma/schema.prisma` y su equivalente en SQL en **una única migración base**: `Backend/prisma/migrations/20260721050627_init/`. Esta migración es la **línea base oficial** del proyecto (el historial de desarrollo anterior fue consolidado en ella).

```bash
# Dentro de Backend/, con el .env ya configurado
npx prisma migrate dev
```

- **Qué hace:**
  1. Se conecta a MySQL usando `DATABASE_URL`.
  2. **Crea la base de datos** si no existe.
  3. Aplica la migración `20260721050627_init`, generando **todas las tablas, índices, claves foráneas y enums**.
  4. Regenera el cliente Prisma (por eso, tras este comando, la sección 9 suele ser redundante).
- **Cuándo:** la primera vez tras clonar, y cada vez que se agreguen nuevas migraciones al repositorio.
- **Resultado esperado:** mensajes como:

```
Datasource "db": MySQL database "haku_courier" at "localhost:3306"
Applying migration `20260721050627_init`
Your database is now in sync with your schema.
```

### 8.1. Alternativa para entornos reproducibles / CI

```bash
npx prisma migrate deploy
```

- **Diferencia:** `migrate deploy` **solo aplica las migraciones existentes** sin generar nuevas ni detectar "drift"; **no** regenera el cliente Prisma (por eso, con esta opción, la sección 9 es obligatoria). Es la forma recomendada para pipelines o para aplicar el esquema sin el flujo interactivo de desarrollo.

### 8.2. Verificar el estado de las migraciones

```bash
npx prisma migrate status
```

- **Resultado esperado:** `Database schema is up to date!` y `1 migration found in prisma/migrations`.

---

## 9. Generación del cliente Prisma

El **cliente Prisma** es el código TypeScript tipado que el Backend usa para consultar la base. Se genera a partir de `schema.prisma`.

```bash
# Dentro de Backend/
npx prisma generate
```

- **Qué hace:** genera/actualiza el cliente Prisma en `Backend/node_modules/@prisma/client`.
- **Cuándo:**
  - Siempre después de `prisma migrate deploy` (que no lo genera).
  - Tras cualquier cambio en `schema.prisma`.
  - Si al compilar/ejecutar aparecen errores de tipos de `@prisma/client`.
  - (Con `prisma migrate dev` normalmente ya se ejecutó solo.)
- **Resultado esperado:** `✔ Generated Prisma Client (vX.Y.Z) to ./node_modules/@prisma/client`.

---

## 10. Levantar Backend

Con dependencias instaladas, `.env` configurado y migración aplicada, ya se puede iniciar la API.

### 10.1. Modo desarrollo (recomendado)

```bash
# Dentro de Backend/
npm run start:dev
```

- **Qué hace:** compila y arranca NestJS en **modo watch** (`nest start --watch`): recarga automáticamente al guardar cambios en el código.
- **Cuándo:** durante el desarrollo diario.
- **Resultado esperado:** en los logs aparece el mapeo de todas las rutas y, al final:

```
[PrismaService] Conexion a la base de datos establecida
[NestApplication] Nest application successfully started
[Bootstrap] Aplicacion escuchando en http://localhost:3000/api/v1
[Bootstrap] Documentacion Swagger en http://localhost:3000/api/docs
```

### 10.2. Otros modos disponibles (scripts reales)

| Comando | Uso |
| --- | --- |
| `npm run start` | Arranca sin watch (`nest start`). |
| `npm run build` | Compila a `dist/` (`nest build`). Útil para verificar que todo compila. |
| `npm run start:prod` | Ejecuta el build ya compilado (`node dist/src/main`). Requiere haber corrido `npm run build` antes. En este modo **Swagger queda deshabilitado** si `NODE_ENV=production`. |

- **URL del Backend:** `http://localhost:3000/api/v1`
- **Documentación Swagger** (solo si `NODE_ENV` ≠ `production`): `http://localhost:3000/api/docs`

---

## 11. Levantar Frontend

En **otra terminal** (dejando el Backend corriendo):

```bash
# Dentro de Frontend/
npm run dev
```

- **Qué hace:** inicia el servidor de desarrollo de Vite con recarga en caliente (HMR).
- **Cuándo:** durante el desarrollo diario, en paralelo al Backend.
- **Resultado esperado:**

```
VITE v8.x.x  ready in NNN ms
➜  Local:   http://localhost:5173/
```

- **URL del Frontend:** `http://localhost:5173/`

> **Si Vite dice `Port 5173 is in use, trying another one...`** y arranca en `5174`, las peticiones a la API serán bloqueadas por CORS (el Backend solo permite `http://localhost:5173`). Libera el puerto 5173 o ajusta `CORS_ORIGIN` (ver sección 13).

### 11.1. Otros scripts del Frontend

| Comando | Uso |
| --- | --- |
| `npm run build` | Compila para producción (`tsc && vite build`). |
| `npm run preview` | Sirve el build de producción localmente. |
| `npm run typecheck` | Verifica tipos sin emitir (`tsc --noEmit`). |
| `npm run lint` | Ejecuta ESLint. |

---

## 12. Verificaciones finales

Con Backend y Frontend arriba, confirma que todo funciona:

### 12.1. Health check del Backend

```bash
curl http://localhost:3000/api/v1
```

- **Resultado esperado:** responde `Hello World!` (endpoint raíz de salud).

### 12.2. Swagger disponible

Abre en el navegador: `http://localhost:3000/api/docs`

- **Resultado esperado:** interfaz Swagger con todos los módulos (Usuarios, Auth, Pedidos, Reportes, etc.). *(Solo en `development`.)*

### 12.3. Frontend carga

Abre en el navegador: `http://localhost:5173/`

- **Resultado esperado:** la aplicación **HAKU Courier** carga y muestra la pantalla de login.

### 12.4. Crear un usuario y probar el login (opcional pero recomendado)

El sistema arranca con la base **vacía** (sin usuarios). Para poder iniciar sesión, crea al menos un usuario administrador usando la API:

```bash
curl -X POST http://localhost:3000/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombres":"Admin","apellidos":"HAKU","usuario":"admin","correo":"admin@haku.com","password":"Admin123!","rol":"administrador"}'
```

- **Resultado esperado:** `HTTP 201` con el usuario creado (sin exponer la contraseña; se almacena solo su hash argon2).
- Para un repartidor, repite el `POST` con `"rol":"motorizado"`.
- Luego inicia sesión desde el Frontend (`http://localhost:5173/`) con `usuario` o `correo` + la contraseña.

> El endpoint público `POST /api/v1/auth/register` también crea cuentas, pero **siempre con rol `motorizado`** (autorregistro). Para crear un **administrador** usa `POST /api/v1/usuarios` como arriba.

---

## 13. Problemas comunes y soluciones

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| El Backend no arranca y se queja de una variable de entorno | Falta `Backend/.env` o una variable obligatoria | Crea el `.env` (sección 5) y completa todas las variables obligatorias. |
| `Error: listen EADDRINUSE: address already in use :::3000` | El puerto 3000 ya está ocupado (otra instancia del Backend corriendo) | Detén el proceso previo (`lsof -nP -iTCP:3000 -sTCP:LISTEN` → `kill <PID>`) o cambia `PORT` en el `.env`. |
| `RSA public key is not available client side` al conectar a MySQL | MySQL 8 con `caching_sha2_password` sin la clave RSA cacheada | Asegúrate de que `DATABASE_URL` incluya `?allowPublicKeyRetrieval=true`. |
| `Access denied for user ...` en la migración | Usuario/contraseña incorrectos en `DATABASE_URL` | Corrige las credenciales; verifica que el servidor MySQL esté arriba (`docker ps`). |
| No puede conectar / `ECONNREFUSED` a `localhost:3306` | El servidor MySQL no está corriendo | Levanta el contenedor (`docker start mysql-db`) o tu servicio MySQL local. |
| El Frontend arranca pero las llamadas a la API fallan con error de **CORS** | El Frontend corre en un puerto (p. ej. `5174`) distinto al permitido por `CORS_ORIGIN` (`5173`) | Libera el puerto 5173 (o mata el proceso que lo ocupa) para que Vite use 5173; o añade el puerto real a `CORS_ORIGIN` en el `.env` del Backend y reinícialo. |
| El Frontend no arranca: `Variable de entorno faltante: VITE_API_BASE_URL` | Falta `Frontend/.env` o la variable | Crea `Frontend/.env` (sección 6.2) con `VITE_API_BASE_URL`. |
| Errores de tipos de `@prisma/client` al compilar el Backend | Cliente Prisma no generado o desactualizado | Ejecuta `npx prisma generate` (sección 9). |
| Cambié `schema.prisma` y la base no coincide | No se aplicó una nueva migración | Genera y aplica la migración con `npx prisma migrate dev --name <descripcion>`. |
| Las peticiones de login fallan con 401 aunque el usuario "exista" | La base está vacía o el usuario fue creado en otra base | Verifica que `DATABASE_URL` apunte a la base correcta y crea el usuario (sección 12.4). |

---

## 14. Comandos útiles

### Backend (`Backend/`)

```bash
npm install                       # Instalar dependencias
npm run start:dev                 # Arrancar en modo watch (desarrollo)
npm run start:prod                # Arrancar el build compilado (requiere npm run build)
npm run build                     # Compilar a dist/
npx prisma migrate dev            # Crear BD (si no existe) + aplicar migraciones + generar cliente
npx prisma migrate deploy         # Aplicar migraciones existentes (CI/producción, no genera cliente)
npx prisma migrate status         # Ver estado de migraciones
npx prisma generate               # Regenerar el cliente Prisma
npx prisma studio                 # (Opcional) Explorador visual de la base de datos
```

### Frontend (`Frontend/`)

```bash
npm install                       # Instalar dependencias
npm run dev                       # Servidor de desarrollo (http://localhost:5173)
npm run build                     # Build de producción
npm run preview                   # Servir el build localmente
npm run typecheck                 # Verificar tipos (tsc --noEmit)
npm run lint                      # ESLint
```

### Diagnóstico rápido

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN  # Ver qué proceso ocupa el puerto del Backend
lsof -nP -iTCP:5173 -sTCP:LISTEN  # Ver qué proceso ocupa el puerto del Frontend
curl http://localhost:3000/api/v1 # Health check del Backend (espera "Hello World!")
docker ps                         # Ver contenedores (incluido MySQL) en ejecución
```

---

## 15. Flujo completo — de `git clone` a HAKU funcionando

Secuencia mínima de principio a fin (asume Node 22, npm 10, Git y Docker instalados):

```bash
# 1. Clonar
git clone <URL_DEL_REPOSITORIO> SistemaHaku
cd SistemaHaku

# 2. (Si no tienes MySQL) Levantar MySQL 8 en Docker
docker run --name mysql-db -e MYSQL_ROOT_PASSWORD=TU_PASSWORD -p 3306:3306 -d mysql:8

# 3. Backend: dependencias
cd Backend
npm install

# 4. Backend: variables de entorno
cp .env.example .env
#   → edita DATABASE_URL en .env con tu usuario/password/base, p. ej.:
#     mysql://root:TU_PASSWORD@localhost:3306/haku_courier?allowPublicKeyRetrieval=true

# 5. Backend: crear BD + aplicar migración inicial + generar cliente Prisma
npx prisma migrate dev

# 6. Backend: arrancar (dejar esta terminal abierta)
npm run start:dev
#   → http://localhost:3000/api/v1  (Swagger: http://localhost:3000/api/docs)

# --- en OTRA terminal ---

# 7. Frontend: dependencias
cd Frontend
npm install

# 8. Frontend: variables de entorno
cp .env.example .env
#   → VITE_API_BASE_URL=http://localhost:3000/api/v1

# 9. Frontend: arrancar
npm run dev
#   → http://localhost:5173/

# 10. (Opcional) Crear un administrador para poder iniciar sesión
curl -X POST http://localhost:3000/api/v1/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombres":"Admin","apellidos":"HAKU","usuario":"admin","correo":"admin@haku.com","password":"Admin123!","rol":"administrador"}'
```

**Al terminar tendrás:**

- Backend NestJS en `http://localhost:3000/api/v1` conectado a MySQL.
- Frontend Vite en `http://localhost:5173/`.
- Base de datos con el esquema completo aplicado desde la migración base `init`.
- (Si hiciste el paso 10) un usuario admin para iniciar sesión.

### Cómo detener los servicios

- En cada terminal, `Ctrl + C` detiene el proceso correspondiente.
- Si quedaron procesos sueltos: `lsof -nP -iTCP:3000 -sTCP:LISTEN` / `-iTCP:5173` y `kill <PID>`.
- Para detener MySQL en Docker: `docker stop mysql-db` (y `docker start mysql-db` para reanudarlo sin perder datos).

---

## Recomendaciones (archivos faltantes detectados)

Durante la elaboración de esta guía se detectaron los siguientes puntos de mejora en la documentación del repositorio. **No se modificó ningún archivo del proyecto**; se listan como recomendación:

1. **`Backend/README.md` es el boilerplate genérico de `nest new`** (no describe el proyecto real ni cómo levantarlo). Se recomienda reemplazarlo con un README propio de HAKU o con un enlace a esta guía. *(Coincide con el ítem M8 de `documentacion/AUDIT_REPORT.md` y el backlog de `documentacion/TECH_DEBT.md`.)*
2. **No existe un README en la raíz del proyecto** ni un README en `Frontend/`. Un `README.md` raíz breve que apunte a esta guía facilitaría la primera orientación de un desarrollador nuevo.
3. **No hay archivo de arranque conjunto** (por ejemplo, un `docker-compose.yml` que levante MySQL + Backend + Frontend, o un script `dev` en la raíz). Hoy cada servicio se levanta manualmente en su carpeta; un `docker-compose.yml` reduciría los pasos 2–9 de la sección 15.
4. Los archivos **`.env.example` existen y están completos** tanto en `Backend/` como en `Frontend/` (bien), y fueron la referencia usada en esta guía.

---

**Referencias del proyecto:**

- `documentacion/backend/ARCHITECTURE.md` — arquitectura y decisiones técnicas del Backend.
- `documentacion/backend/API_OVERVIEW.md` — endpoints, casos de uso y flujo del negocio.
- `documentacion/backend/DEVELOPMENT_PROGRESS.md` — historial de decisiones del Backend.
- `documentacion/frontend/FRONTEND_PROGRESS.md` — historial de decisiones del Frontend.
- `Frontend/CLAUDE.md` — guía permanente de arquitectura y convenciones del Frontend.
