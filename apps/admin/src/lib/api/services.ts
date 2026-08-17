import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export interface ServiceItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioBase: string;
  afectoIgv: boolean;
  isActive: boolean;
}

export interface ServiceInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precioBase: number;
  afectoIgv?: boolean;
}

export async function fetchAllServices(): Promise<ServiceItem[]> {
  const result = await apiFetch<PaginatedResult<ServiceItem>>("/servicios?pageSize=100");
  return result.data;
}

export async function fetchServices(params: { q?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<ServiceItem>>(`/servicios?${search.toString()}`);
}

export async function createService(input: ServiceInput) {
  return apiFetch<ServiceItem>("/servicios", { method: "POST", body: JSON.stringify(input) });
}

export async function updateService(id: string, input: Partial<ServiceInput> & { isActive?: boolean }) {
  return apiFetch<ServiceItem>(`/servicios/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deactivateService(id: string) {
  return apiFetch<void>(`/servicios/${id}`, { method: "DELETE" });
}
