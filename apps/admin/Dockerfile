# Imagen de servidor (staging/producción). NO se usa en desarrollo local — ver docs/26 §26.10.
# Build de contexto: raíz del monorepo (docker build -f apps/admin/Dockerfile .)

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @funeraria-minaya/admin run build

FROM node:20-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system nodejs && useradd --system --gid nodejs nextjs
COPY --from=builder /repo/apps/admin/.next/standalone ./
COPY --from=builder /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /repo/apps/admin/public ./apps/admin/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/admin/server.js"]
