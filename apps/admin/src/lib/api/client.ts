import { useAuthStore } from "../auth/auth-store";
import { ApiError, parseApiError } from "./errors";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

/**
 * Fetch "crudo": sin token de acceso, con cookies (para /auth/login,
 * /auth/refresh, /auth/logout, que son @Public() en el backend y dependen
 * de la cookie httpOnly de refresh, no del access token en memoria).
 */
export async function rawFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

// Single-flight: evita disparar /auth/refresh en paralelo. El backend rota el
// refresh token en cada uso y revoca toda la sesión si detecta reutilización
// (docs/16 §16.1) — dos llamadas simultáneas cerrarían la sesión del usuario.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = rawFetch("/auth/refresh", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { accessToken: string };
        useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Fetch autenticado para el resto de la API: agrega el access token en
 * memoria y, ante un 401, intenta renovarlo una sola vez antes de
 * reintentar la petición original (RF-002).
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  attempt: "first" | "retry" = "first",
): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const res = await rawFetch(path, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && attempt === "first") {
    const newToken = await refreshAccessToken();
    if (newToken) return apiFetch<T>(path, init, "retry");
    useAuthStore.getState().clear();
    throw new ApiError(401, { code: "NO_AUTENTICADO", message: "Sesión expirada." });
  }

  if (!res.ok) throw await parseApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export { ApiError };
