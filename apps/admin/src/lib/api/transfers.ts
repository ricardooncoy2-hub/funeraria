import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export type TransferState = "SOLICITADA" | "APROBADA" | "ENVIADA" | "RECIBIDA" | "CANCELADA";

export interface Transfer {
  id: string;
  codigo: string;
  sedeOrigenId: string;
  sedeDestinoId: string;
  estado: TransferState;
  motivo: string | null;
  sedeOrigen: { id: string; codigo: string };
  sedeDestino: { id: string; codigo: string };
}

export interface TransferItem {
  id: string;
  productoId: string;
  cantidad: string;
  costoUnitario: string | null;
  producto: { id: string; codigo: string; nombre: string };
}

export interface TransferDetail extends Transfer {
  sedeOrigen: { id: string; codigo: string; nombre: string };
  sedeDestino: { id: string; codigo: string; nombre: string };
  items: TransferItem[];
}

export interface TransferItemInput {
  productoId: string;
  cantidad: number;
}

export interface TransferInput {
  sedeOrigenId: string;
  sedeDestinoId: string;
  motivo?: string;
  items: TransferItemInput[];
}

export async function fetchTransfers(params: { page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<Transfer>>(`/transferencias?${search.toString()}`);
}

export async function fetchTransfer(id: string) {
  return apiFetch<TransferDetail>(`/transferencias/${id}`);
}

export async function createTransfer(input: TransferInput) {
  return apiFetch<TransferDetail>("/transferencias", { method: "POST", body: JSON.stringify(input) });
}

export async function aprobarTransfer(id: string) {
  return apiFetch<TransferDetail>(`/transferencias/${id}/aprobar`, { method: "POST" });
}

export async function enviarTransfer(id: string) {
  return apiFetch<TransferDetail>(`/transferencias/${id}/enviar`, { method: "POST" });
}

export async function recibirTransfer(id: string) {
  return apiFetch<TransferDetail>(`/transferencias/${id}/recibir`, { method: "POST" });
}

export async function cancelarTransfer(id: string) {
  return apiFetch<TransferDetail>(`/transferencias/${id}/cancelar`, { method: "POST" });
}
