import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export interface Supplier {
  id: string;
  tipoDocumento: "DNI" | "CE" | "RUC";
  numeroDocumento: string;
  razonSocial: string;
  nombreComercial: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  isActive: boolean;
}

export interface SupplierInput {
  tipoDocumento: "DNI" | "CE" | "RUC";
  numeroDocumento: string;
  razonSocial: string;
  nombreComercial?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
}

export async function fetchSuppliers(params: { q?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<Supplier>>(`/proveedores?${search.toString()}`);
}

export async function createSupplier(input: SupplierInput) {
  return apiFetch<Supplier>("/proveedores", { method: "POST", body: JSON.stringify(input) });
}

export async function updateSupplier(id: string, input: Partial<SupplierInput> & { isActive?: boolean }) {
  return apiFetch<Supplier>(`/proveedores/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deactivateSupplier(id: string) {
  return apiFetch<void>(`/proveedores/${id}`, { method: "DELETE" });
}
