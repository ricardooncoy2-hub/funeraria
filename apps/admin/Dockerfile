# Imagen de servidor (staging/producción). NO se usa en desarrollo local — ver docs/26 §26.10.
# Build de contexto: raíz del monorepo (docker build -f apps/admin/Dockerfile .)

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
# NEXT_PUBLIC_API_URL se hornea en el bundle del navegador en build time —
# sin pasarlo como build arg queda fijo en el fallback de desarrollo
# (localhost:3001), rompiendo las peticiones desde el navegador en producción.
# apps/admin no hace fetch en Server Components (SPA autenticada, ver
# docs/15 §15.1), así que a diferencia de apps/web no necesita alcanzar la
# API durante el build — no requiere `network` especial en docker-compose.yml.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @funeraria-minaya/admin run build

FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system nodejs && useradd --system --gid nodejs nextjs
# `COPY --from=builder` corre como root; sin --chown, apps/admin/.next queda
# de root y Next no puede crear apps/admin/.next/cache en runtime como
# usuario `nextjs` (cache de optimización de imágenes) — EACCES.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/admin/public ./apps/admin/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/admin/server.js"]
