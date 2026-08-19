import { ApiError, parseApiError } from "./errors";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

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
