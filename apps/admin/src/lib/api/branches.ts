import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export interface Branch {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  telefono: string | null;
  correo: string | null;
  isActive: boolean;
  isMain: boolean;
}

export interface BranchInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  telefono?: string;
  correo?: string;
}

export async function fetchBranches(params: { q?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<Branch>>(`/sedes?${search.toString()}`);
}

export async function fetchAllBranches(): Promise<Branch[]> {
  const result = await apiFetch<PaginatedResult<Branch>>("/sedes?pageSize=100");
  return result.data;
}

export async function createBranch(input: BranchInput) {
  return apiFetch<Branch>("/sedes", { method: "POST", body: JSON.stringify(input) });
}

export async function updateBranch(id: string, input: Partial<BranchInput> & { isActive?: boolean }) {
  return apiFetch<Branch>(`/sedes/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deactivateBranch(id: string) {
  return apiFetch<void>(`/sedes/${id}`, { method: "DELETE" });
}

export async function setPrincipalBranch(id: string) {
  return apiFetch<Branch>(`/sedes/${id}/principal`, { method: "PATCH" });
}
