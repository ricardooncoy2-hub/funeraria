import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export interface Cash {
  id: string;
  sedeId: string;
  nombre: string;
  isActive: boolean;
  openings: CashOpening[];
}

export interface CashOpening {
  id: string;
  cajaId: string;
  sedeId: string;
  usuarioAperturaId: string;
  usuarioCierreId: string | null;
  saldoInicial: string;
  saldoEsperado: string | null;
  saldoContado: string | null;
  diferencia: string | null;
  estado: "ABIERTA" | "CERRADA";
  fechaApertura: string;
  fechaCierre: string | null;
}

export interface CashMovement {
  id: string;
  aperturaCajaId: string;
  cajaId: string;
  tipo: "INGRESO" | "EGRESO" | "VENTA_EFECTIVO" | "RETIRO";
  monto: string;
  pagoId: string | null;
  concepto: string;
  usuarioId: string;
  createdAt: string;
}

export interface CashResumen {
  apertura: CashOpening;
  totales: Record<string, string>;
  saldoTeorico: string;
}

export async function fetchCajas(params: { sedeId?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.sedeId) search.set("sedeId", params.sedeId);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 100));
  return apiFetch<PaginatedResult<Cash>>(`/cajas?${search.toString()}`);
}

export async function abrirCaja(cajaId: string, saldoInicial: number) {
  return apiFetch<CashOpening>(`/cajas/${cajaId}/aperturas`, {
    method: "POST",
    body: JSON.stringify({ saldoInicial }),
  });
}

export async function fetchResumen(aperturaId: string) {
  return apiFetch<CashResumen>(`/aperturas-caja/${aperturaId}/resumen`);
}

export async function registrarMovimiento(
  aperturaId: string,
  input: { tipo: "INGRESO" | "EGRESO" | "RETIRO"; monto: number; concepto: string },
) {
  return apiFetch<CashMovement>(`/aperturas-caja/${aperturaId}/movimientos`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function cerrarCaja(aperturaId: string, saldoContado: number) {
  return apiFetch<CashOpening>(`/aperturas-caja/${aperturaId}/cerrar`, {
    method: "POST",
    body: JSON.stringify({ saldoContado }),
  });
}
