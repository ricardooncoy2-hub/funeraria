import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export const ORIGENES_INTERNOS = ["WHATSAPP", "TELEFONO", "PRESENCIAL", "OTRO"] as const;
export type OrigenCotizacion = (typeof ORIGENES_INTERNOS)[number];

export const QUOTATION_STATES = [
  "SOLICITADA",
  "EN_REVISION",
  "ASIGNADA",
  "CONTACTADA",
  "EN_NEGOCIACION",
  "ACEPTADA",
  "RECHAZADA",
  "VENCIDA",
  "CANCELADA",
] as const;
export type QuotationState = (typeof QUOTATION_STATES)[number];

export interface QuotationItem {
  id: string;
  itemTipo: "PRODUCTO" | "SERVICIO";
  productoId: string | null;
  servicioId: string | null;
  producto: { id: string; nombre: string } | null;
  servicio: { id: string; nombre: string } | null;
  cantidad: string;
  precioReferencial: string | null;
}

export interface Quotation {
  id: string;
  codigo: string;
  origen: OrigenCotizacion;
  solicitanteNombres: string;
  solicitanteTelefono: string;
  solicitanteCorreo: string | null;
  clienteId: string | null;
  sedePreferidaId: string | null;
  sedeAsignadaId: string | null;
  sedePreferida: { id: string; nombre: string } | null;
  sedeAsignada: { id: string; nombre: string } | null;
  planId: string | null;
  observaciones: string | null;
  estado: QuotationState;
  fecha: string;
  validoHasta: string | null;
  consentimientoDatos: boolean;
  usuarioAsignadoId: string | null;
}

export interface QuotationDetail extends Quotation {
  cliente: { id: string; nombres: string; apellidos: string } | null;
  items: QuotationItem[];
  plan: { id: string; nombre: string } | null;
}

export interface QuotationItemInput {
  itemTipo: "PRODUCTO" | "SERVICIO";
  productoId?: string;
  servicioId?: string;
  cantidad: number;
  precioReferencial?: number;
}

export interface CreateQuotationInput {
  origen: OrigenCotizacion;
  solicitanteNombres: string;
  solicitanteTelefono: string;
  solicitanteCorreo?: string;
  clienteId?: string;
  sedePreferidaId?: string;
  planId?: string;
  observaciones?: string;
  validoHasta?: string;
  consentimientoDatos: boolean;
  items?: QuotationItemInput[];
}

export interface UpdateQuotationInput {
  origen?: OrigenCotizacion;
  solicitanteNombres?: string;
  solicitanteTelefono?: string;
  solicitanteCorreo?: string;
  observaciones?: string;
  validoHasta?: string;
}

export async function fetchQuotations(params: { page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<Quotation>>(`/cotizaciones?${search.toString()}`);
}

export async function fetchQuotation(id: string) {
  return apiFetch<QuotationDetail>(`/cotizaciones/${id}`);
}

export async function createQuotation(input: CreateQuotationInput) {
  return apiFetch<QuotationDetail>("/cotizaciones", { method: "POST", body: JSON.stringify(input) });
}

export async function updateQuotation(id: string, input: UpdateQuotationInput) {
  return apiFetch<QuotationDetail>(`/cotizaciones/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function asignarQuotation(id: string, sedeAsignadaId: string, usuarioAsignadoId?: string) {
  return apiFetch<QuotationDetail>(`/cotizaciones/${id}/asignar`, {
    method: "POST",
    body: JSON.stringify({ sedeAsignadaId, usuarioAsignadoId }),
  });
}

export async function setQuotationStatus(id: string, estado: QuotationState) {
  return apiFetch<QuotationDetail>(`/cotizaciones/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
}

export async function convertirQuotationVenta(id: string) {
  return apiFetch<{ id: string; codigo: string }>(`/cotizaciones/${id}/convertir-venta`, { method: "POST" });
}
