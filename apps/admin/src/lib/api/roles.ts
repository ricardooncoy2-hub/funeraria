import { apiFetch } from "./client";

export interface Role {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  isActive: boolean;
}

export interface RoleDetail extends Role {
  permisos: string[];
}

export interface Permission {
  id: string;
  codigo: string;
  nombre: string;
  modulo: string;
}

export async function fetchRoles() {
  return apiFetch<Role[]>("/roles");
}

export async function fetchRole(id: string) {
  return apiFetch<RoleDetail>(`/roles/${id}`);
}

export async function fetchPermissions() {
  return apiFetch<Permission[]>("/permisos");
}
