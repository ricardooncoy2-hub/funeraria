# Despliegue en VPS (Docker Compose) — Funeraria Minaya

Runbook operativo para desplegar el stack en el servidor de producción (Contabo VPS,
usuario `deploy`, stack en `/srv/funeraria/stack`). Complementa `docs/26_infraestructura.md`
y `docs/27_docker.md`, que son la especificación general — este archivo son los pasos
concretos para *este* servidor.

> Docker Compose es exclusivamente para servidor (staging/producción). En desarrollo
> local se usa MariaDB y Node nativos + `pnpm dev` (ver `docs/26_infraestructura.md` §26.10).
> No ejecutar este procedimiento en local.

## MariaDB: red `internal` dedicada, dentro del mismo compose

Todo en un único `docker-compose.yml` (`nginx`, `web`, `admin`, `api`, `mariadb`).
`mariadb` se conecta únicamente a una red `backend` declarada `internal: true` (sin
ruta a internet ni a ninguna otra red) — `api` es el único servicio conectado tanto a
`backend` como a la red `default`, así que ni `web`, ni `admin`, ni `nginx` tienen
ruta hacia la base de datos. Persiste vía bind mount a `/srv/funeraria/mariadb` en el
host, no un volumen nombrado de Docker. Ver ADR-020 en
`docs/34_decisiones_arquitectonicas.md`.

**Si ya existe un contenedor `funeraria-mariadb` corriendo desde un compose separado**
(de un intento anterior), hay que consolidarlo en este único archivo: apagar ese
compose viejo (`docker compose down` — el bind mount a `/srv/funeraria/mariadb`
conserva los datos, no se pierden), y usar los datos ya existentes en esa misma ruta
al levantar el `mariadb` de este `docker-compose.yml` (mismo `volumes:` de destino).

## Variante: sin dominio, acceso solo por IP

Si todavía no hay dominio y solo se quiere ver la aplicación por `http://IP_DEL_VPS`,
es posible, con dos ajustes respecto al flujo con dominio:

1. **Nginx y Cloudflare no aplican todavía** — sin dominio no hay a qué apuntar el
   `server_name` de cada bloque (`docs/26_infraestructura.md` §26.2 asume nombres de
   host, no una sola IP repartida en varios sitios). Saltar los pasos **4 (Nginx)** y
   **5 (DNS)** de abajo; en su lugar, publicar el puerto de cada contenedor
   directamente hacia el VPS.

2. **La sesión del admin no se renueva sola sin HTTPS.** El refresh token va en una
   cookie `httpOnly` que el backend marca `secure: true` cuando `NODE_ENV=production`
   (`apps/api/src/modules/auth/auth.controller.ts:109`) — un navegador nunca guarda ni
   reenvía una cookie `Secure` sobre HTTP plano. El login inicial sí funciona igual
   (el `accessToken` viaja en el body de la respuesta, no en cookie), pero al expirar
   ese access token (`JWT_ACCESS_EXPIRES`, 15 min por defecto) el refresh silencioso
   fallará y tocará volver a iniciar sesión. Para esta fase de solo-vista es aceptable;
   si molesta, subir `JWT_ACCESS_EXPIRES` a algo como `2h` solo mientras se prueba por
   IP, y devolverlo a `15m` en cuanto haya dominio + HTTPS real.

**No editar el `docker-compose.yml` del repo** (se necesita intacto para cuando haya
dominio) — crear en su lugar `docker-compose.override.yml` en `/srv/funeraria/stack`,
que Compose combina automáticamente con el base:

```yaml
# docker-compose.override.yml — solo para la fase sin dominio (acceso por IP).
# Borrar este archivo cuando haya dominio real y se use Nginx.
services:
  web:
    ports: ["3000:3000"]
  admin:
    ports: ["3002:3000"]
  api:
    ports: ["3001:3001"]
```

Y ajustar los `.env.*` del paso 3 con la IP en vez del dominio — **incluido el
`.env` raíz**, que es el que de verdad usa `docker compose build`:

```ini
# .env.api
CORS_ORIGINS="http://IP_DEL_VPS:3000,http://IP_DEL_VPS:3002"
```
```ini
# .env (raíz) y .env.web
NEXT_PUBLIC_API_URL="http://IP_DEL_VPS:3001/api/v1"
NEXT_PUBLIC_SITE_URL="http://IP_DEL_VPS:3000"
```
```ini
# .env.admin (NEXT_PUBLIC_API_URL también debe coincidir en el .env raíz)
NEXT_PUBLIC_API_URL="http://IP_DEL_VPS:3001/api/v1"
```

> Importante: `NEXT_PUBLIC_*` se hornea dentro del bundle de Next.js **en build time**,
> no se lee en runtime. Estos valores deben estar correctos *antes* de correr
> `docker compose build` — si se cambian después, hay que reconstruir la
> imagen, no solo reiniciar el contenedor.

Luego, seguir la secuencia del paso 6 (mariadb → api → admin → web), saltando 6.5:

```bash
docker compose up -d mariadb
docker compose build api && docker compose up -d api
docker compose build admin && docker compose up -d admin
docker compose build web && docker compose up -d web
# sin nginx (6.5)
```

Y verificar (paso 8) directo por puerto:

```bash
curl -I http://IP_DEL_VPS:3001/api/v1/health
curl -I http://IP_DEL_VPS:3000
curl -I http://IP_DEL_VPS:3002
```

El resto del procedimiento (§1-3, §6-7 con las adaptaciones de arriba) aplica igual.

**Firewall:** `docs/26_infraestructura.md` §26.3 recomienda `ufw` abierto solo en
80/443. Para esta variante hay que abrir también 3000-3002 temporalmente:

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 3002/tcp
```

Y cerrarlos (`sudo ufw delete allow <puerto>/tcp`) cuando se pase a Nginx + dominio,
para no dejar la API/admin expuestos directamente además de por Nginx.

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
pull) — esto no afecta a los datos de MariaDB, que viven en `/srv/funeraria/mariadb`
en el host (bind mount), independiente de dónde esté clonado el repo.

## 1. Traer/actualizar el código

```bash
cd /srv/funeraria/stack
git pull origin main   # o git clone <repo-url> . si aún no está
```

## 2. Confirmar credenciales de MariaDB

Si `funeraria-mariadb` ya está corriendo desde un intento anterior y ya está sano,
no hace falta recrearlo — solo confirmar sus credenciales reales (`.env.mariadb`,
paso 3) para que coincidan con las que ya se usaron al crear la base de datos:

```bash
docker ps -a --filter name=funeraria-mariadb   # confirmar si existe/está sano
```

Anotar el `MARIADB_USER`/`MARIADB_PASSWORD` reales — se necesitan en el paso 3 para
que la API pueda autenticarse.

## 3. Crear los `.env.*` que faltan

Copiar los templates y completarlos (nunca se versionan, están en `.gitignore`):

```bash
cp .env.api.example .env.api
cp .env.web.example .env.web
cp .env.admin.example .env.admin
cp .env.mariadb.example .env.mariadb
cp .env.example .env
```

**`.env.mariadb`** — si MariaDB ya está corriendo de un intento anterior, completar
con las **mismas** credenciales que ya se usaron al crearlo (no valores nuevos, o la
API no podrá autenticarse). Si es la primera vez, generar una clave nueva para
`MARIADB_PASSWORD`/`MARIADB_ROOT_PASSWORD`.

El último (`.env`, sin sufijo) es distinto a los demás: no es el `env_file` de
ningún contenedor, es el archivo que **Docker Compose lee automáticamente**
para resolver `${...}` dentro del propio `docker-compose.yml` — hoy sirve para
que `build.args` de `web`/`admin` reciba `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_SITE_URL` y `NEXT_PUBLIC_WHATSAPP_NUMBER` en **cualquier**
invocación de `docker compose build`, sin depender de pasar `--env-file` a
mano. Sus valores deben coincidir con los de `.env.web`/`.env.admin`.

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

> **Importante sobre `NEXT_PUBLIC_*`:** Next.js hornea estas variables dentro del
> bundle del navegador **en build time**, no en runtime — el `env_file:` de Compose
> solo aplica al contenedor ya corriendo, no al build de la imagen. Por eso
> `docker-compose.yml` declara `build.args` para `web`/`admin` que leen
> `${NEXT_PUBLIC_API_URL}` etc. del `.env` raíz creado arriba. Si se cambia un
> valor `NEXT_PUBLIC_*` después de un build, hay que reconstruir la imagen, no
> solo reiniciar el contenedor.
>
> Si por error el build corre sin que estas variables se resuelvan (p. ej. un
> `.env` raíz vacío o ausente), Compose las pasa como **string vacío**, no
> como variable ausente — un `??` en el código no cae a su valor por defecto
> ante un string vacío, solo ante `undefined`/`null`. Esto ya causó un build
> roto (`new URL("")` revienta con `ERR_INVALID_URL`) y quedó corregido en el
> código (`apps/web/src/lib/site-config.ts`, `apps/*/src/lib/api/client.ts`
> usan `||`), pero conviene igual no depender de ese blindaje y asegurarse de
> que `.env` esté bien completado antes de construir.

## 4. Configurar Nginx

> Saltar este paso y el siguiente si se está usando la variante "sin dominio" de
> arriba.

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

## 6. Levantar el stack, en orden: MariaDB → API → Admin → Web → Nginx

> Con la variante "sin dominio", omitir el paso 6.5 (Nginx) — ver arriba.

Un componente a la vez, verificando cada uno antes de seguir con el siguiente. Todos
los comandos se corren desde `/srv/funeraria/stack` (raíz del repo).

### 6.1 MariaDB

```bash
docker compose up -d mariadb
docker compose ps mariadb            # esperar "Up (healthy)" (puede tardar ~10-30s)
docker compose logs mariadb --tail=20
```

No hace `build` porque usa la imagen oficial (`mariadb:11.8.8`), no un Dockerfile
propio. Si ya estaba corriendo de antes (ver sección "MariaDB" al inicio de este
documento), este comando no lo recrea — solo confirma que sigue sano.

### 6.2 API

```bash
docker compose build api
docker compose up -d api
docker compose logs api --tail=50
```

Buscar en el log, en este orden: `Applying migration...` (o `No pending
migrations`) seguido del arranque de Nest (`Nest application successfully
started`), sin errores de conexión a `mariadb:3306`. Las migraciones
(`prisma migrate deploy`) corren automáticamente al iniciar el contenedor — están en
el `CMD` del Dockerfile, no hace falta un paso aparte. `api` espera a que `mariadb`
esté `healthy` por el `depends_on` del compose, así que no arranca antes de tiempo
aunque el paso 6.1 haya sido muy reciente.

Verificar que responde (la imagen `node:20-slim` no trae `curl`/`wget`, se usa Node
directo):
```bash
docker compose exec api node -e "require('http').get('http://localhost:3001/api/v1/health',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(d))})"
```

### 6.3 Admin

```bash
docker compose build admin
docker compose up -d admin
docker compose logs admin --tail=20
```

`apps/admin` es una SPA autenticada sin fetch en Server Components — su build no
depende de que `api` esté arriba (a diferencia de `web`, ver 6.4). Buscar en el log
`Ready in ...ms` o el arranque normal del server de Next.js, sin errores.

### 6.4 Web

```bash
docker compose build web
docker compose up -d web
docker compose logs web --tail=20
```

`apps/web` hace `fetch()` en Server Components durante el propio `next build`
(prerender estático de `/`, `/servicios`, etc.) — como `api` ya está arriba desde el
paso 6.2, el build intenta alcanzarlo por la red de Compose (`network: default` en el
build de `web`, ver `docker-compose.yml`) y hornea datos reales en el HTML estático.

Si el log del build muestra líneas como `[build] /public/servicios no alcanzable
durante next build, usando []`, el build igual terminó bien (no bloquea el
despliegue — ver `apps/web/src/lib/api/client.ts`), pero home/`/servicios`/etc.
quedaron con datos vacíos hasta la primera revalidación (`revalidate: 3600`) o hasta
reconstruir `web` de nuevo una vez confirmado que `api` responde:
```bash
docker compose build web && docker compose up -d web
```

### 6.5 Nginx

```bash
docker compose up -d nginx
docker compose ps                    # todo "Up" o "Up (healthy)"
```

Nginx recién ahora, al final, porque hace de proxy hacia los tres anteriores — no
tiene sentido levantarlo antes de que `api`/`admin`/`web` existan.

## 7. Sembrar datos iniciales (una sola vez)

El contenedor final de `api` es una imagen de producción sin `ts-node`/`typescript`
(se podan al hacer `pnpm deploy --prod`), así que **no** se puede correr el seed con
`docker compose exec api ...` directamente. Usar la etapa `builder` (que sí tiene
todo) como contenedor descartable, en la red `funeraria_backend` (nombre fijo
declarado en `docker-compose.yml` — ahí vive MariaDB):

```bash
docker build --target builder -f apps/api/Dockerfile -t funeraria-api-builder .
docker run --rm --network funeraria_backend --env-file .env.api \
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

- Backups automatizados de `/srv/funeraria/mariadb` (bind mount del volumen de datos
  de MariaDB, ver `docker-compose.yml`).
- Observabilidad/logging centralizado.
- Pipeline de CI/CD que construya y despliegue automáticamente (hoy es 100% manual vía
  SSH — no hay GitHub Actions que haga `docker build`/push/deploy).
- Endurecimiento de seguridad adicional (fail2ban, ufw solo 80/443/22 restringido —
  confirmar que ya está en el VPS per `docs/26_infraestructura.md` §26.3).
