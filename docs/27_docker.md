# 27 — Docker y Docker Compose

> **Alcance.** Este capítulo aplica a **servidor** (staging/producción). En **desarrollo local (Windows)** no se usa Docker: los servicios corren nativos (ver [26](26_infraestructura.md) §26.10). El `docker-compose.yml` vive en el repo pero solo se ejecuta en el servidor.

## 27.1 Contenedores

| Servicio | Imagen base | Puerto interno |
|---|---|---|
| `nginx` | nginx:alpine | 80/443 |
| `web` | node (build Next.js público) | 3000 |
| `app` | node (build Next.js admin) | 3000 |
| `api` | node (build NestJS) | 3001 |
| `mariadb` | mariadb:11.8 | 3306 (solo interno) |
| `redis` (opcional) | redis:alpine | 6379 (interno) |

## 27.2 Estrategia de imágenes

- **Multi-stage builds** para reducir tamaño: etapa `builder` (instala deps y compila) y etapa `runner` (solo artefactos + deps de producción).
- Next.js con `output: 'standalone'` para runners ligeros.
- NestJS: compilar a `dist/` y ejecutar `node dist/main.js`.
- Prisma: generar cliente en build; ejecutar `prisma migrate deploy` en el arranque de `api` (o job dedicado) antes de servir.
- **Gestor de paquetes: pnpm** (workspaces del monorepo). En las imágenes, habilitar vía `corepack enable` y usar `pnpm install --frozen-lockfile` con `pnpm-lock.yaml`; aprovechar el store para builds reproducibles.

## 27.3 docker-compose (estructura conceptual, no configuración final)

```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: [ ./nginx/conf.d:/etc/nginx/conf.d:ro, certs:/etc/nginx/certs:ro ]
    depends_on: [web, app, api]
    restart: unless-stopped

  web:
    build: ./apps/web
    env_file: .env.web
    restart: unless-stopped

  app:
    build: ./apps/admin
    env_file: .env.admin
    restart: unless-stopped

  api:
    build: ./apps/api
    env_file: .env.api
    depends_on: [mariadb]
    restart: unless-stopped
    # arranque: prisma migrate deploy && node dist/main.js

  mariadb:
    image: mariadb:11.8
    env_file: .env.mariadb
    volumes: [ mariadb_data:/var/lib/mysql ]   # el datadir de MariaDB sigue siendo /var/lib/mysql
    # NO exponer puertos al host en producción
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

  # redis: (opcional)

volumes:
  mariadb_data:
  certs:
```

> El compose de producción no publica el puerto de MariaDB al host; solo la red interna de Docker lo alcanza.

## 27.4 Variables de entorno (por servicio)

- `api`: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `S3_*`, `SMTP_*`, `CORS_ORIGINS`, `IGV_PORCENTAJE` (o desde BD), `REDIS_URL?`.
- `web`/`app`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `WHATSAPP_NUMBER`, claves de captcha públicas.
- `mariadb`: `MARIADB_ROOT_PASSWORD`, `MARIADB_DATABASE`, `MARIADB_USER`, `MARIADB_PASSWORD` (la imagen oficial de MariaDB también acepta los equivalentes `MYSQL_*` por compatibilidad).

Los `.env.*` no se versionan; se derivan de `.env.example` documentados.

## 27.5 Salud y reinicio

- `restart: unless-stopped` en todos.
- Healthchecks: MariaDB (`healthcheck.sh --connect`), API (`GET /api/v1/health`), web/app (endpoint de salud).
- Nginx depende de servicios listos; reintenta.

## 27.6 Migraciones y seed

- **Migraciones:** `prisma migrate deploy` en despliegue (idempotente).
- **Seed inicial** (`prisma/seed.ts`): configuración de empresa, sede principal, roles/permisos base, métodos de pago, financiador "cliente" genérico si aplica, usuario administrador inicial (con `must_change_password`).

## 27.7 Persistencia y backups

- Volumen `mariadb_data` persistente. Backups gestionados aparte (ver [30](30_backups.md)), no dependientes solo del volumen.
- Archivos en S3 (no en volúmenes de contenedor).

## 27.8 Recomendaciones

- Fijar versiones de imágenes (evitar `latest` en producción).
- Usuarios no-root dentro de los contenedores.
- Límites de recursos por servicio si el VPS es ajustado (`deploy.resources`/`mem_limit`).
- Logs a stdout/stderr para recolección centralizada (ver [31](31_observabilidad.md)).
