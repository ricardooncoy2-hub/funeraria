import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// El .env real vive junto a la app que lo consume (apps/api), no en la raíz.
dotenv.config({ path: path.join(__dirname, 'apps/api/.env') });

export default defineConfig({
  schema: path.join('apps', 'api', 'prisma', 'schema.prisma'),
  migrations: {
    seed: 'pnpm --filter @funeraria-minaya/api run prisma:seed:run',
  },
});
