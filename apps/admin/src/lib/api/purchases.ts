import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export type PurchaseState = "BORRADOR" | "RECIBIDA" | "ANULADA";

export interface Purchase {
  id: string;
  sedeId: string;
  proveedorId: string;
  numeroDocumento: string | null;
  fecha: string;
  subtotal: string;
  igv: string;
  total: string;
  estado: PurchaseState;
  observaciones: string | null;
  proveedor: { id: string; razonSocial: string };
  branch: { id: string; codigo: string };
}

export interface PurchaseItem {
  id: string;
  productoId: string;
  cantidad: string;
  costoUnitario: string;
  subtotal: string;
  afectoIgv: boolean;
  producto: { id: string; codigo: string; nombre: string };
}

export interface PurchaseDetail extends Purchase {
  items: PurchaseItem[];
  branch: { id: string; codigo: string; nombre: string };
  proveedor: { id: string; razonSocial: string; numeroDocumento: string };
}

export interface PurchaseItemInput {
  productoId: string;
  cantidad: number;
  costoUnitario: number;
  afectoIgv?: boolean;
}

export interface PurchaseInput {
  proveedorId: string;
  numeroDocumento?: string;
  fecha: string;
  observaciones?: string;
  items: PurchaseItemInput[];
}

export async function fetchPurchases(params: { page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<Purchase>>(`/compras?${search.toString()}`);
}

export async function fetchPurchase(id: string) {
  return apiFetch<PurchaseDetail>(`/compras/${id}`);
}

export async function createPurchase(input: PurchaseInput) {
  return apiFetch<PurchaseDetail>("/compras", { method: "POST", body: JSON.stringify(input) });
}

export async function updatePurchase(id: string, input: Partial<PurchaseInput>) {
  return apiFetch<PurchaseDetail>(`/compras/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function recepcionarPurchase(id: string) {
  return apiFetch<PurchaseDetail>(`/compras/${id}/recepcionar`, { method: "POST" });
}

export async function anularPurchase(id: string) {
  return apiFetch<PurchaseDetail>(`/compras/${id}/anular`, { method: "POST" });
}
