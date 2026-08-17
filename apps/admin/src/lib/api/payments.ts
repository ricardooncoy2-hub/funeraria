import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export interface PaymentMethod {
  id: string;
  codigo: string;
  nombre: string;
  esEfectivo: boolean;
}

export interface DestinoPago {
  id: string;
  tipo: "CAJA" | "CUENTA_BANCARIA" | "POS" | "BILLETERA_DIGITAL" | "OTRO";
  nombre: string;
  cajaId: string | null;
  isActive: boolean;
}

export interface Payment {
  id: string;
  financiamientoId: string;
  ventaId: string;
  monto: string;
  metodoPagoId: string;
  destinoPagoId: string;
  sedeCobroId: string;
  estado: "CONFIRMADO" | "ANULADO";
  referencia: string | null;
  fecha: string;
  metodoPago: { id: string; codigo: string };
  destinoPago: { id: string; tipo: string; nombre: string };
  venta: { id: string; codigo: string };
}

export interface PaymentInput {
  financiamientoId: string;
  metodoPagoId: string;
  destinoPagoId: string;
  sedeCobroId: string;
  monto: number;
  referencia?: string;
}

export async function fetchPaymentMethods() {
  return apiFetch<PaymentMethod[]>("/metodos-pago");
}

export async function fetchDestinosPago() {
  return apiFetch<DestinoPago[]>("/destinos-pago");
}

export async function fetchPayments(
  params: { page?: number; pageSize?: number; ventaId?: string; sedeCobroId?: string; metodo?: string } = {},
) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  if (params.ventaId) search.set("ventaId", params.ventaId);
  if (params.sedeCobroId) search.set("sedeCobroId", params.sedeCobroId);
  if (params.metodo) search.set("metodo", params.metodo);
  return apiFetch<PaginatedResult<Payment>>(`/pagos?${search.toString()}`);
}

export async function createPayment(input: PaymentInput) {
  return apiFetch<Payment>("/pagos", { method: "POST", body: JSON.stringify(input) });
}

export async function anularPayment(id: string, motivo: string) {
  return apiFetch<Payment>(`/pagos/${id}/anular`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}
