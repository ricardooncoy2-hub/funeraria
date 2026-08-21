# 27 — Docker y Docker Compose

> **Alcance.** Este capítulo aplica a **servidor** (staging/producción). En **desarrollo local (Windows)** no se usa Docker: los servicios corren nativos (ver [26](26_infraestructura.md) §26.10). El `docker-compose.yml` vive en el repo pero solo se ejecuta en el servidor.

## 27.1 Contenedores

| Servicio | Imagen base | Puerto interno |
|---|---|---|
| `nginx` | nginx:alpine | 80/443 |
| `web` | node (build Next.js público) | 3000 |
| `admin` | node (build Next.js admin) | 3000 |
| `api` | node (build NestJS) | 3001 |
| `mariadb` (compose separado, ver §27.3) | mariadb:11.8 | 3306 (solo interno) |
| `redis` (opcional) | redis:alpine | 6379 (interno) |

## 27.2 Estrategia de imágenes

- **Multi-stage builds** para reducir tamaño: etapa `builder` (instala deps y compila) y etapa `runner` (solo artefactos + deps de producción).
- Next.js con `output: 'standalone'` para runners ligeros.
- NestJS: compilar a `dist/` y ejecutar `node dist/main.js`.
- Prisma: generar cliente en build; ejecutar `prisma migrate deploy` en el arranque de `api` (o job dedicado) antes de servir.
- **Gestor de paquetes: pnpm** (workspaces del monorepo). En las imágenes, habilitar vía `corepack enable` y usar `pnpm install --frozen-lockfile` con `pnpm-lock.yaml`; aprovechar el store para builds reproducibles.

## 27.3 docker-compose (estructura conceptual, no configuración final)

**MariaDB vive en un `docker-compose.yml` separado** del resto del stack (ADR-020,
[34](34_decisiones_arquitectonicas.md)) — vida útil independiente de
`web`/`admin`/`api`, y una red propia `internal: true` (sin ruta a internet ni a
ninguna otra red) que el stack principal referencia como `external`, conectando
*solo* `api` a ella:

```yaml
# docker/mariadb/docker-compose.yml — se despliega en su propia carpeta del servidor.
services:
  mariadb:
    image: mariadb:11.8
    container_name: funeraria-mariadb
    networks: [backend]
    env_file: .env
    volumes: [ /srv/funeraria/mariadb:/var/lib/mysql ]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  backend:
    name: funeraria_backend   # nombre fijo, referenciado como external abajo
    internal: true
```

```yaml
# docker-compose.yml (raíz del repo) — el resto del stack.
networks:
  backend:
    external: true
    name: funeraria_backend

services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: [ ./nginx/conf.d:/etc/nginx/conf.d:ro, certs:/etc/nginx/certs:ro ]
    depends_on: [web, admin, api]
    restart: unless-stopped

  web:
    build: { context: ., dockerfile: apps/web/Dockerfile }
    env_file: .env.web
    restart: unless-stopped

  admin:
    build: { context: ., dockerfile: apps/admin/Dockerfile }
    env_file: .env.admin
    restart: unless-stopped

  api:
    build: { context: ., dockerfile: apps/api/Dockerfile }
    env_file: .env.api
    networks: [default, backend]   # backend: única forma de llegar a MariaDB
    restart: unless-stopped
    # arranque: prisma migrate deploy && node dist/main.js

  # redis: (opcional)

volumes:
  certs:
```

> Ni `web`, ni `admin`, ni `nginx` tienen ruta de red hacia MariaDB — solo `api`. El
> puerto de MariaDB tampoco se publica al host en ningún caso.
>
> Compose no expresa `depends_on` entre archivos/proyectos distintos: el operador
> debe garantizar que el compose de MariaDB esté arriba y sano antes de construir/
> levantar `api` (ver `DEPLOYMENT.md` en la raíz del repo para el procedimiento
> paso a paso de un servidor real).

## 27.4 Variables de entorno (por servicio)

- `api`: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `S3_*`, `SMTP_*`, `CORS_ORIGINS`, `IGV_PORCENTAJE` (o desde BD), `REDIS_URL?`.
- `web`/`admin`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, claves de captcha públicas.
- `mariadb` (su propio `.env`, en `docker/mariadb/`, no en el compose principal): `MARIADB_ROOT_PASSWORD`, `MARIADB_DATABASE`, `MARIADB_USER`, `MARIADB_PASSWORD` (la imagen oficial de MariaDB también acepta los equivalentes `MYSQL_*` por compatibilidad).

Los `.env.*` no se versionan; se derivan de `.env.example` documentados.

## 27.5 Salud y reinicio

- `restart: unless-stopped` en todos.
- Healthchecks: MariaDB (`healthcheck.sh --connect`), API (`GET /api/v1/health`), web/admin (endpoint de salud).
- Nginx depende de servicios listos; reintenta.

## 27.6 Migraciones y seed

- **Migraciones:** `prisma migrate deploy` en despliegue (idempotente).
- **Seed inicial** (`prisma/seed.ts`): configuración de empresa, sede principal, roles/permisos base, métodos de pago, financiador "cliente" genérico si aplica, usuario administrador inicial (con `must_change_password`).

## 27.7 Persistencia y backups

- MariaDB persiste vía bind mount a una ruta del host (`/srv/funeraria/mariadb`, ver `docker/mariadb/docker-compose.yml`), no un volumen nombrado de Docker — así el dato sobrevive aunque se elimine el compose que lo gestiona. Backups gestionados aparte (ver [30](30_backups.md)), no dependientes solo del propio mount.
- Archivos en S3 (no en volúmenes de contenedor).

## 27.8 Recomendaciones

- Fijar versiones de imágenes (evitar `latest` en producción).
- Usuarios no-root dentro de los contenedores.
- Límites de recursos por servicio si el VPS es ajustado (`deploy.resources`/`mem_limit`).
- Logs a stdout/stderr para recolección centralizada (ver [31](31_observabilidad.md)).
