# Imagen de servidor (staging/producción). NO se usa en desarrollo local — ver docs/26 §26.10.
# Build de contexto: raíz del monorepo (docker build -f apps/web/Dockerfile .)

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
# NEXT_PUBLIC_* se hornean en el bundle del navegador en build time.
# API_INTERNAL_URL (sin prefijo NEXT_PUBLIC_, nunca llega al navegador) es lo
# que usan las peticiones que corren en Node durante el prerender estático de
# `next build` — necesita la red de Docker Compose para alcanzar `api`
# (ver `network: default` en docker-compose.yml para este servicio).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_WHATSAPP_NUMBER
ARG API_INTERNAL_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    API_INTERNAL_URL=$API_INTERNAL_URL
RUN pnpm --filter @funeraria-minaya/web run build

FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system nodejs && useradd --system --gid nodejs nextjs
# `COPY --from=builder` corre como root; sin --chown, apps/web/.next queda de
# root y Next no puede crear apps/web/.next/cache en runtime como usuario
# `nextjs` (cache de optimización de imágenes) — EACCES.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
