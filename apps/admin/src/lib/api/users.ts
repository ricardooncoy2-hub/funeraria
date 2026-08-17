import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export interface User {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  usuario: string;
  telefono: string | null;
  esCorporativo: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
  ultimoLoginAt: string | null;
}

export interface UserDetail extends User {
  userRoles: { role: { codigo: string; nombre: string } }[];
  userBranches: { sedeId: string; branch: { codigo: string; nombre: string } }[];
}

export interface UserInput {
  nombres: string;
  apellidos: string;
  correo: string;
  usuario: string;
  telefono?: string;
  esCorporativo?: boolean;
}

export async function fetchUsers(params: { q?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<User>>(`/usuarios?${search.toString()}`);
}

export async function fetchUser(id: string) {
  return apiFetch<UserDetail>(`/usuarios/${id}`);
}

export async function createUser(input: UserInput & { password: string }) {
  return apiFetch<User>("/usuarios", { method: "POST", body: JSON.stringify(input) });
}

export async function updateUser(id: string, input: Partial<UserInput> & { isActive?: boolean }) {
  return apiFetch<User>(`/usuarios/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deactivateUser(id: string) {
  return apiFetch<void>(`/usuarios/${id}`, { method: "DELETE" });
}

export async function setUserRoles(id: string, roles: string[]) {
  return apiFetch<UserDetail>(`/usuarios/${id}/roles`, {
    method: "PATCH",
    body: JSON.stringify({ roles }),
  });
}

export async function setUserSedes(id: string, sedeIds: string[]) {
  return apiFetch<UserDetail>(`/usuarios/${id}/sedes`, {
    method: "PATCH",
    body: JSON.stringify({ sedeIds }),
  });
}
