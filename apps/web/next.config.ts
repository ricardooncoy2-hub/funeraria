import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necesario para el build standalone en Docker (imagen de servidor, ver docs/27).
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // El file-tracer del build standalone deja afuera los archivos ESM de
  // @swc/helpers (solo copia cjs/), aunque next los requiere en runtime —
  // revienta el contenedor con "Cannot find module '.../@swc/helpers/esm/...'".
  // Los valores de esta opción se resuelven relativos a ESTA carpeta
  // (apps/web), no a outputFileTracingRoot — ver docs de Next.js.
  outputFileTracingIncludes: {
    "/*": ["../../node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/**/*"],
  },
};

export default nextConfig;
