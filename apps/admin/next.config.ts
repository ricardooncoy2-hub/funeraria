import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necesario para el build standalone en Docker (imagen de servidor, ver docs/27).
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
