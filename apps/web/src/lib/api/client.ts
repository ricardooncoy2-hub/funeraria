import { ApiError, parseApiError } from "./errors";

/**
 * `API_INTERNAL_URL` (solo servidor, nunca se expone al navegador — no lleva
 * prefijo `NEXT_PUBLIC_`) permite que las peticiones que corren en Node
 * (prerender estático en build, Server Components) usen el nombre interno
 * del servicio Docker (`http://api:3001/api/v1`), mientras el navegador
 * sigue usando `NEXT_PUBLIC_API_URL` (dominio/IP pública). Sin esto, el build
 * de `next build` en Docker falla con ECONNREFUSED: el contenedor `api` no
 * es alcanzable en `localhost` desde el contenedor de build de `web`.
 */
// `||` en vez de `??`: si el build.args de Docker no resuelve la variable,
// Compose la pasa como string vacío, no como `undefined` — `??` no caería al
// fallback en ese caso (ver apps/web/src/lib/site-config.ts).
const API_URL =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

/**
 * Cliente del sitio público — sin sesión, sin token, sin cookies. Los
 * endpoints `/public/*` del backend son `@Public()` (docs/15 §15.1). Acepta
 * las opciones nativas de `fetch` de Next (p. ej. `next: { revalidate }`)
 * para SSG/ISR, a diferencia del `apiFetch` de `apps/admin` que además
 * maneja access token + refresh (no aplica acá, no hay sesión).
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) throw await parseApiError(res);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Variante para endpoints de listado que se prerenderizan como página
 * estática (`/`, `/servicios`, `/productos`, `/planes`, `/sedes`, sitemap):
 * si la API no es alcanzable durante el propio `next build` — típico en
 * despliegues nuevos de Docker donde la red entre el contenedor de build y
 * `api` puede fallar por razones fuera del control de esta app — no revienta
 * el build entero, sino que degrada a lista vacía. La página queda cacheada
 * así hasta la próxima revalidación (`revalidate`), momento en que un
 * visitante real dispara un refetch con datos correctos. Fuera del build
 * (dev, runtime normal) el error se propaga igual que con `apiFetch`, sin
 * ocultar fallas reales de la API en producción.
 */
export async function apiFetchList<T>(path: string, init: RequestInit = {}): Promise<T[]> {
  try {
    return await apiFetch<T[]>(path, init);
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(`[build] ${path} no alcanzable durante next build, usando [] — se completa en runtime.`);
      return [];
    }
    throw error;
  }
}

export { ApiError };
