# Funeraria Minaya — Sistema web multi-sede

Monorepo (pnpm) para el sistema de gestión de la Funeraria Minaya. La especificación
completa vive en [`/docs`](docs/00_indice.md); las reglas de trabajo para Claude Code
están en [`CLAUDE.md`](CLAUDE.md). Este README solo cubre cómo arrancar el entorno.

## Estructura

```
apps/
  api/     NestJS — API REST (/api/v1)
  web/     Next.js — sitio público
  admin/   Next.js — panel administrativo
packages/
  types/   Tipos/DTOs compartidos
  config/  tsconfig base compartido
```

## Requisitos (desarrollo local en Windows, sin Docker)

> Docker/`docker-compose.yml` es **solo** para servidor (staging/producción). En
> local todo corre nativo. Ver `docs/26_infraestructura.md` §26.10.

- **Node LTS** (>=20.9). El repo se desarrolló con Node 20.20; si tu Node LTS
  actual es mayor (22/24), también funciona — solo mantén la misma línea mayor
  en dev/CI/servidor.
- **MariaDB 11.8 LTS** nativa (no Docker). Instalador oficial o `winget`.
- **pnpm** vía Corepack (no usar npm ni yarn):
  ```powershell
  corepack enable
  ```

## 1. Base de datos

Crear la base de datos con la collation obligatoria del proyecto (`utf8mb4_uca1400_ai_ci`,
**no** `utf8mb4_0900_ai_ci` — ver ADR-002) y un usuario de aplicación:

```sql
CREATE DATABASE funeraria_minaya CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
CREATE USER 'funeraria_app'@'localhost' IDENTIFIED BY 'elige-una-clave';
GRANT ALL PRIVILEGES ON funeraria_minaya.* TO 'funeraria_app'@'localhost';
-- Necesario para que `prisma migrate dev` cree su base "shadow" al generar migraciones:
GRANT ALL PRIVILEGES ON `prisma_migrate_shadow_db%`.* TO 'funeraria_app'@'localhost';
GRANT CREATE, DROP ON *.* TO 'funeraria_app'@'localhost';
FLUSH PRIVILEGES;
```

## 2. Variables de entorno

Cada app tiene su propio `.env.example`. Copiar y ajustar:

```powershell
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env.local
Copy-Item apps\admin\.env.example apps\admin\.env.local
```

Editar `apps/api/.env` con la `DATABASE_URL` del usuario creado en el paso 1
(esquema `mysql://` obligatorio aunque el motor sea MariaDB — ver ADR-002).

## 3. Instalación y arranque

```powershell
pnpm install

# Aplica el esquema inicial (configuracion_empresa, sedes, roles, permisos,
# usuarios, metodos_pago) sobre tu MariaDB local:
pnpm prisma migrate dev

# Carga datos base: empresa, sede principal, roles, permisos, métodos de pago
# y un usuario admin inicial (must_change_password=true):
pnpm prisma db seed

# Levanta las 3 apps en paralelo:
pnpm dev
```

Puertos de desarrollo: `api` → 3001, `web` → 3000, `admin` → 3002.

## 4. Verificar

```powershell
curl http://localhost:3001/api/v1/health
```

Debe responder `{"status":"ok","database":"up",...}`, confirmando que la API
levantó y que la conexión a MariaDB funciona. Documentación OpenAPI en
`http://localhost:3001/api/v1/docs`.

Credenciales del seed (cambiar en el primer login — `must_change_password=1`):
usuario `admin`, contraseña definida por `SEED_ADMIN_PASSWORD` en `.env`
(por defecto `ChangeMe123!` si no se define).

## Otros comandos

```powershell
pnpm lint          # ESLint (las 3 apps)
pnpm typecheck     # tsc --noEmit (las 3 apps)
pnpm build         # build de producción de las 3 apps
pnpm test          # unit tests (api)
pnpm test:unit
pnpm test:integration   # e2e (api), requiere la BD local levantada
```

## Docker (solo servidor)

`docker-compose.yml`, los `Dockerfile` de cada app y las plantillas `.env.*.example`
en la raíz son artefactos de **despliegue** (staging/producción vía Nginx +
Cloudflare, ver `docs/26` y `docs/27`). No se usan ni se necesitan para el día a
día en local.

## Estado — Fase 0

Fundaciones técnicas: monorepo, tooling, esqueleto NestJS con health check,
esquema Prisma inicial + migración + seed, esqueletos Next.js, Docker de servidor
y CI. Sin lógica de negocio todavía — eso empieza en Fase 1 (`auth` + `authz` +
`SedeScopeGuard`), según `docs/33_roadmap.md`.
