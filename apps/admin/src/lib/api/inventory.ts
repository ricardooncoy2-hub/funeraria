import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export interface InventoryRow {
  id: string;
  sedeId: string;
  productoId: string;
  stockActual: string;
  stockMinimo: string;
  stockMaximo: string | null;
  costoPromedio: string;
  branch: { id: string; codigo: string; nombre: string };
  producto: { id: string; codigo: string; nombre: string };
}

export interface InventoryMovement {
  id: string;
  sedeId: string;
  productoId: string;
  tipo: string;
  cantidad: string;
  costoUnitario: string | null;
  stockAnterior: string;
  stockPosterior: string;
  documentoTipo: string | null;
  documentoId: string | null;
  motivo: string | null;
  usuarioId: string;
  createdAt: string;
}

export interface AdjustmentInput {
  sedeId: string;
  productoId: string;
  tipo: "AJUSTE_ENTRADA" | "AJUSTE_SALIDA" | "MERMA";
  cantidad: number;
  motivo: string;
}

export async function fetchStock(params: {
  sedeId?: string;
  productoId?: string;
  page?: number;
  pageSize?: number;
}) {
  const search = new URLSearchParams();
  if (params.sedeId) search.set("sedeId", params.sedeId);
  if (params.productoId) search.set("productoId", params.productoId);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<InventoryRow>>(`/inventarios?${search.toString()}`);
}

export async function fetchLowStock(sedeId?: string) {
  const search = new URLSearchParams();
  if (sedeId) search.set("sedeId", sedeId);
  return apiFetch<InventoryRow[]>(`/inventarios/stock-bajo?${search.toString()}`);
}

export async function fetchKardex(params: {
  sedeId: string;
  productoId: string;
  desde?: string;
  hasta?: string;
}) {
  const search = new URLSearchParams();
  search.set("sedeId", params.sedeId);
  search.set("productoId", params.productoId);
  if (params.desde) search.set("desde", params.desde);
  if (params.hasta) search.set("hasta", params.hasta);
  return apiFetch<InventoryMovement[]>(`/inventarios/kardex?${search.toString()}`);
}

export async function createAdjustment(input: AdjustmentInput) {
  return apiFetch<InventoryMovement>("/inventarios/ajustes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
