import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

const TIPOS_DOCUMENTO = ["DNI", "CE", "PASAPORTE", "RUC"] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];
export { TIPOS_DOCUMENTO };

export interface Customer {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  distritoId: string | null;
  isActive: boolean;
}

export interface CustomerInput {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  distritoId?: string;
}

export async function fetchCustomers(params: { q?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<Customer>>(`/clientes?${search.toString()}`);
}

export async function createCustomer(input: CustomerInput) {
  return apiFetch<Customer>("/clientes", { method: "POST", body: JSON.stringify(input) });
}

export async function updateCustomer(id: string, input: Partial<CustomerInput> & { isActive?: boolean }) {
  return apiFetch<Customer>(`/clientes/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deactivateCustomer(id: string) {
  return apiFetch<void>(`/clientes/${id}`, { method: "DELETE" });
}
