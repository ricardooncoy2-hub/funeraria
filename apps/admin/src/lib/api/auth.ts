import { apiFetch, ApiError, rawFetch } from "./client";
import { parseApiError } from "./errors";

/** Coincide con AuthController.serializeUser() en apps/api. */
export interface AuthUser {
  id: string;
  correo: string;
  usuario: string;
  nombres: string;
  apellidos: string;
  esCorporativo: boolean;
  mustChangePassword: boolean;
  roles: string[];
  permisos: string[];
  sedeIds: string[];
  isCorporate: boolean;
}

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export async function login(usuario: string, password: string): Promise<LoginResult> {
  const res = await rawFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ usuario, password }),
  });
  if (!res.ok) throw await parseApiError(res);
  return (await res.json()) as LoginResult;
}

/** Renovación silenciosa vía la cookie httpOnly de refresh (docs/15 §15.2). */
export async function refreshSession(): Promise<{ accessToken: string } | null> {
  const res = await rawFetch("/auth/refresh", { method: "POST" });
  if (!res.ok) return null;
  return (await res.json()) as { accessToken: string };
}

export async function fetchMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me");
}

export async function logout(): Promise<void> {
  await rawFetch("/auth/logout", { method: "POST" });
}

export async function changePassword(passwordActual: string, passwordNueva: string) {
  return apiFetch<{ status: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ passwordActual, passwordNueva }),
  });
}

export { ApiError };
