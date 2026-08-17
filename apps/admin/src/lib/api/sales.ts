import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export type SaleState = "CONFIRMADA" | "ANULADA";

export interface Sale {
  id: string;
  codigo: string;
  sedeVentaId: string;
  clienteId: string;
  fecha: string;
  total: string;
  estado: SaleState;
  cliente: { id: string; nombres: string; apellidos: string | null };
  sedeVenta: { id: string; codigo: string };
}

export interface SaleItem {
  id: string;
  itemTipo: "PRODUCTO" | "SERVICIO" | "PLAN";
  descripcion: string;
  cantidad: string;
  precioUnitario: string;
  descuentoLinea: string;
  afectoIgv: boolean;
  subtotal: string;
}

export interface Financing {
  id: string;
  ventaId: string;
  origenTipo: "CLIENTE" | "FINANCIADOR";
  clienteId: string | null;
  financiadorId: string | null;
  monto: string;
  montoAutorizado: string | null;
  estado: string;
  numeroPoliza: string | null;
  financiador?: { id: string; nombre: string } | null;
}

export interface SalePayment {
  id: string;
  financiamientoId: string;
  monto: string;
  metodoPagoId: string;
  destinoPagoId: string;
  sedeCobroId: string;
  estado: "CONFIRMADO" | "ANULADO";
  referencia: string | null;
  fecha: string;
}

export interface SaleDetail extends Sale {
  subtotal: string;
  descuento: string;
  baseImponible: string;
  igv: string;
  observaciones: string | null;
  sedeVenta: { id: string; codigo: string; nombre: string };
  cliente: { id: string; nombres: string; apellidos: string | null; numeroDocumento: string };
  vendedor: { id: string; nombres: string; apellidos: string };
  items: SaleItem[];
  financings: Financing[];
  payments: SalePayment[];
}

export interface EstadoCuenta {
  total: string;
  financiado: string;
  cobrado: string;
  porCobrar: string;
  porFinanciador: {
    financiamientoId: string;
    origenTipo: string;
    monto: string;
    cobrado: string;
    pendiente: string;
    estado: string;
  }[];
}

export interface SaleItemInput {
  itemTipo: "PRODUCTO" | "SERVICIO" | "PLAN";
  productoId?: string;
  servicioId?: string;
  planId?: string;
  cantidad: number;
  descuentoLinea?: number;
}

export interface FinancingInput {
  origenTipo: "CLIENTE" | "FINANCIADOR";
  financiadorId?: string;
  monto: number;
  montoAutorizado?: number;
  numeroPoliza?: string;
}

export interface SaleInput {
  sedeVentaId: string;
  clienteId: string;
  items: SaleItemInput[];
  descuentoGlobal?: number;
  observaciones?: string;
  financings?: FinancingInput[];
}

export async function fetchSales(params: { page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<Sale>>(`/ventas?${search.toString()}`);
}

export async function fetchSale(id: string) {
  return apiFetch<SaleDetail>(`/ventas/${id}`);
}

export async function fetchEstadoCuenta(id: string) {
  return apiFetch<EstadoCuenta>(`/ventas/${id}/estado-cuenta`);
}

export async function createSale(input: SaleInput) {
  return apiFetch<SaleDetail>("/ventas", { method: "POST", body: JSON.stringify(input) });
}

export async function anularSale(id: string, motivo: string) {
  return apiFetch<SaleDetail>(`/ventas/${id}/anular`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}
