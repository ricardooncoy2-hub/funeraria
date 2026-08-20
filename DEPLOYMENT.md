# Despliegue en VPS (Docker Compose) — Funeraria Minaya

Runbook operativo para desplegar el stack en el servidor de producción (Contabo VPS,
usuario `deploy`, stack en `/srv/funeraria/stack`). Complementa `docs/26_infraestructura.md`
y `docs/27_docker.md`, que son la especificación general — este archivo son los pasos
concretos para *este* servidor.

> Docker Compose es exclusivamente para servidor (staging/producción). En desarrollo
> local se usa MariaDB y Node nativos + `pnpm dev` (ver `docs/26_infraestructura.md` §26.10).
> No ejecutar este procedimiento en local.

## Estado de partida

Ya existe en el servidor:

```
deploy@vmi3262752:/srv/funeraria/stack$ docker compose ps
NAME                IMAGE            COMMAND                  SERVICE   CREATED         STATUS                   PORTS
funeraria-mariadb   mariadb:11.8.8   "docker-entrypoint.s…"   mariadb   8 minutes ago   Up 8 minutes (healthy)   3306/tcp
```

MariaDB corriendo y sano, sin puerto expuesto al host (correcto — nunca debe exponerse
públicamente). Falta desplegar `web`, `admin`, `api` y `nginx`.

## 0. Detalle importante de estructura

El `docker-compose.yml` del repo usa `context: .` (raíz del monorepo) para los tres
builds — **no** es un compose "standalone" que apunte a subcarpetas sueltas. Eso
significa que `/srv/funeraria/stack` debe **ser** el propio repo clonado (no una
carpeta separada con solo el compose file), para que `apps/web/Dockerfile`,
`apps/admin/Dockerfile`, `apps/api/Dockerfile` existan relativos a ahí.

Verificar:

```bash
cd /srv/funeraria/stack
ls apps/web/Dockerfile apps/admin/Dockerfile apps/api/Dockerfile docker-compose.yml
```

Si falta algo, el compose se copió suelto — en ese caso lo correcto es clonar el repo
completo ahí (con `git clone` a una carpeta temporal y mover, o `git init` + remote +
pull si `stack/` ya tiene datos de MariaDB en un volumen y no se quiere perder).

## 1. Traer/actualizar el código

```bash
cd /srv/funeraria/stack
git pull origin main   # o git clone <repo-url> . si aún no está
```

## 2. Confirmar credenciales de MariaDB ya desplegado

**No tocar ni reiniciar el contenedor `mariadb`** — ya está sano. Solo confirmar que
`.env.mariadb` existe en `/srv/funeraria/stack` (obligatorio para que el
`env_file: .env.mariadb` del compose no falle si algún día se recrea ese servicio):

```bash
cat .env.mariadb   # debe existir con MARIADB_DATABASE/USER/PASSWORD/ROOT_PASSWORD ya usados al crearlo
```

Anotar el `MARIADB_USER`/`MARIADB_PASSWORD` reales — se necesitan en el paso 3 para que
la API pueda autenticarse.

## 3. Crear los `.env.*` que faltan

Copiar los templates y completarlos (nunca se versionan, están en `.gitignore`):

```bash
cp .env.api.example .env.api
cp .env.web.example .env.web
cp .env.admin.example .env.admin
```

**`.env.api`** — editar:

```ini
DATABASE_URL="mysql://<MARIADB_USER>:<MARIADB_PASSWORD>@mariadb:3306/funeraria_minaya"
PORT=3001
NODE_ENV=production
CORS_ORIGINS="https://app.TU-DOMINIO,https://www.TU-DOMINIO"

JWT_ACCESS_SECRET=<generar uno único, ver comando abajo>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=<generar otro único, distinto del anterior>
JWT_REFRESH_EXPIRES_DAYS=7
```

Generar cada secreto con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**`.env.web`** y **`.env.admin`** — solo reemplazar `TU-DOMINIO` por el dominio real;
los valores por defecto del template ya están bien estructurados.

> Nota: el proyecto aún no implementa subida a S3 ni envío de correo (`S3_*`/`SMTP_*`
> no se usan en el código todavía, aunque `docs/26`/`docs/27` los mencionan como parte
> de la arquitectura futura) — no hace falta configurarlos para este despliegue.

## 4. Configurar Nginx

```bash
cp nginx/conf.d/default.conf.example nginx/conf.d/default.conf
```

Descomentar los 3 bloques `server` y reemplazar `funeraria-minaya.pe` por el dominio
real. Si se usa Cloudflare por delante (recomendado, ver `docs/26_infraestructura.md`
§26.1):

- **Modo Full (strict)**: generar un *Origin Certificate* gratis en Cloudflare
  (SSL/TLS → Origin Server) y montarlo en el volumen `certs` que ya declara el
  compose; agregar `listen 443 ssl;` + `ssl_certificate`/`ssl_certificate_key` a cada
  bloque.
- **Modo simple para arrancar rápido**: Cloudflare en *Flexible* (Cloudflare↔usuario
  cifrado, Cloudflare↔Nginx en HTTP plano) — solo se necesitan los bloques `listen 80`
  tal cual están en el ejemplo. Válido para salir rápido, pero migrar a Full (strict)
  antes de manejar datos reales de clientes (Ley N.° 29733).

## 5. DNS en Cloudflare

Registros A (o CNAME si se usa proxy) apuntando a la IP del VPS:

- `www.TU-DOMINIO` → web
- `app.TU-DOMINIO` → admin
- `api.TU-DOMINIO` → api

## 6. Levantar el resto del stack

```bash
cd /srv/funeraria/stack
docker compose build web admin api
docker compose up -d web admin api nginx
```

`mariadb` sigue como está (`depends_on: condition: service_healthy` hará que `api`
espere si tuviera que recrearse, pero como ya está healthy, arranca directo).

La API corre `prisma migrate deploy` automáticamente al iniciar (ya está en el `CMD`
del Dockerfile) — revisar que haya corrido bien:

```bash
docker compose logs api --tail=50
```

Buscar algo como `Applying migration...` seguido del arranque de Nest (`Nest
application successfully started`), sin errores de conexión a `mariadb:3306`.

## 7. Sembrar datos iniciales (una sola vez)

El contenedor final de `api` es una imagen de producción sin `ts-node`/`typescript`
(se podan al hacer `pnpm deploy --prod`), así que **no** se puede correr el seed con
`docker compose exec api ...` directamente. Usar la etapa `builder` (que sí tiene
todo) como contenedor descartable, en la misma red que `mariadb`:

```bash
# nombre de la red que Compose ya creó para este stack:
docker network ls | grep funeraria

docker build --target builder -f apps/api/Dockerfile -t funeraria-api-builder .
docker run --rm --network <la-red-de-arriba> --env-file .env.api \
  funeraria-api-builder pnpm --filter @funeraria-minaya/api run prisma:seed:run
```

Esto crea la empresa, sede principal, roles/permisos, catálogo base y el usuario
`admin` (revisar el log final del seed para ver el password inicial si no se fijó
`SEED_ADMIN_PASSWORD`).

## 8. Verificación

```bash
docker compose ps                              # todo "Up (healthy)" o "Up"
curl -I https://api.TU-DOMINIO/api/v1/health    # {"status":"ok","database":"up",...}
curl -I https://www.TU-DOMINIO
curl -I https://app.TU-DOMINIO                  # redirige a /login
```

Y desde el navegador: login en `app.TU-DOMINIO` con el usuario admin sembrado,
confirmar que fuerza cambio de contraseña.

## 9. Pendientes fuera de alcance de este procedimiento

Documentado como pendiente en `docs/33_roadmap.md` (Fase 8) y no necesario para un
primer despliegue funcional:

- Backups automatizados de `mariadb_data`.
- Observabilidad/logging centralizado.
- Pipeline de CI/CD que construya y despliegue automáticamente (hoy es 100% manual vía
  SSH — no hay GitHub Actions que haga `docker build`/push/deploy).
- Endurecimiento de seguridad adicional (fail2ban, ufw solo 80/443/22 restringido —
  confirmar que ya está en el VPS per `docs/26_infraestructura.md` §26.3).
