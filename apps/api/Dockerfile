# Imagen de servidor (staging/producción). NO se usa en desarrollo local — ver docs/26 §26.10.
# Build de contexto: raíz del monorepo (docker build -f apps/api/Dockerfile .)

FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @funeraria-minaya/api exec prisma generate
RUN pnpm --filter @funeraria-minaya/api run build
RUN pnpm --filter @funeraria-minaya/api deploy --prod /repo/deploy/api

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system nestjs && useradd --system --gid nestjs nestjs
COPY --from=builder /repo/deploy/api ./
USER nestjs
EXPOSE 3001
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma && node dist/main.js"]
