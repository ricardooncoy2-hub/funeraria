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
const API_URL =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

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

export { ApiError };
