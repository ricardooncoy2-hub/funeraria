import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  afectoIgv: boolean;
  isActive: boolean;
}

export interface PlanItem {
  id: string;
  itemTipo: "PRODUCTO" | "SERVICIO";
  productoId: string | null;
  servicioId: string | null;
  cantidad: string;
  producto: { id: string; nombre: string } | null;
  servicio: { id: string; nombre: string } | null;
}

export interface PlanDetail extends Plan {
  items: PlanItem[];
}

export interface PlanItemInput {
  itemTipo: "PRODUCTO" | "SERVICIO";
  productoId?: string;
  servicioId?: string;
  cantidad: number;
}

export interface PlanInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  afectoIgv?: boolean;
  items: PlanItemInput[];
}

export async function fetchAllPlans(): Promise<Plan[]> {
  const result = await apiFetch<PaginatedResult<Plan>>("/planes?pageSize=100");
  return result.data;
}

export async function fetchPlans(params: { q?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<Plan>>(`/planes?${search.toString()}`);
}

export async function fetchPlan(id: string) {
  return apiFetch<PlanDetail>(`/planes/${id}`);
}

export async function createPlan(input: PlanInput) {
  return apiFetch<PlanDetail>("/planes", { method: "POST", body: JSON.stringify(input) });
}

export async function updatePlan(id: string, input: Partial<PlanInput> & { isActive?: boolean }) {
  return apiFetch<PlanDetail>(`/planes/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deactivatePlan(id: string) {
  return apiFetch<void>(`/planes/${id}`, { method: "DELETE" });
}
