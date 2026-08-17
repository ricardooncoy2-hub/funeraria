import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export const TIPOS_FINANCIADOR = [
  "SIS",
  "ESSALUD",
  "ASEGURADORA",
  "INSTITUCION",
  "EMPRESA",
  "CONVENIO",
  "OTRO",
] as const;
export type TipoFinanciador = (typeof TIPOS_FINANCIADOR)[number];

export interface Financiador {
  id: string;
  tipo: TipoFinanciador;
  nombre: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  telefono: string | null;
  correo: string | null;
  diasCredito: number | null;
  isActive: boolean;
}

export interface FinanciadorInput {
  tipo: TipoFinanciador;
  nombre: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  telefono?: string;
  correo?: string;
  diasCredito?: number;
}

export interface FinancingRow {
  id: string;
  ventaId: string;
  origenTipo: "CLIENTE" | "FINANCIADOR";
  monto: string;
  estado: string;
  financiador: { id: string; nombre: string; tipo: string } | null;
  venta: { id: string; codigo: string; sedeVentaId: string };
}

export interface AccountReceivableRow {
  financiamientoId: string;
  financiador: { id: string; nombre: string } | null;
  venta: { id: string; codigo: string };
  monto: string;
  cobrado: string;
  pendiente: string;
  dias: number;
  vencido: boolean;
  estado: string;
}

export async function fetchFinanciadores(params: { q?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<Financiador>>(`/financiadores?${search.toString()}`);
}

export async function fetchAllFinanciadores(): Promise<Financiador[]> {
  const result = await apiFetch<PaginatedResult<Financiador>>("/financiadores?pageSize=100");
  return result.data;
}

export async function createFinanciador(input: FinanciadorInput) {
  return apiFetch<Financiador>("/financiadores", { method: "POST", body: JSON.stringify(input) });
}

export async function updateFinanciador(id: string, input: Partial<FinanciadorInput> & { isActive?: boolean }) {
  return apiFetch<Financiador>(`/financiadores/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deactivateFinanciador(id: string) {
  return apiFetch<void>(`/financiadores/${id}`, { method: "DELETE" });
}

export async function fetchFinancings(params: { estado?: string; financiadorId?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.estado) search.set("estado", params.estado);
  if (params.financiadorId) search.set("financiadorId", params.financiadorId);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<FinancingRow>>(`/financiamientos?${search.toString()}`);
}

export async function setFinancingStatus(id: string, estado: string) {
  return apiFetch(`/financiamientos/${id}/estado`, { method: "PATCH", body: JSON.stringify({ estado }) });
}

export async function fetchAccountsReceivable(params: { financiadorId?: string; sedeId?: string; antiguedadMinima?: number } = {}) {
  const search = new URLSearchParams();
  if (params.financiadorId) search.set("financiadorId", params.financiadorId);
  if (params.sedeId) search.set("sedeId", params.sedeId);
  if (params.antiguedadMinima) search.set("antiguedadMinima", String(params.antiguedadMinima));
  return apiFetch<AccountReceivableRow[]>(`/cuentas-por-cobrar?${search.toString()}`);
}
