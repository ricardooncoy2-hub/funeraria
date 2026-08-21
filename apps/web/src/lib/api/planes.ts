import { apiFetch, apiFetchList } from "./client";

export interface Plan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  afectoIgv: boolean;
}

export interface PlanItem {
  id: string;
  itemTipo: "PRODUCTO" | "SERVICIO";
  cantidad: string;
  producto: { id: string; nombre: string } | null;
  servicio: { id: string; nombre: string } | null;
}

export interface PlanDetail extends Plan {
  items: PlanItem[];
}

export function fetchPlanes(): Promise<Plan[]> {
  return apiFetchList<Plan>("/public/planes", { next: { revalidate: 3600 } });
}

export function fetchPlan(codigo: string): Promise<PlanDetail> {
  return apiFetch<PlanDetail>(`/public/planes/${encodeURIComponent(codigo)}`, {
    next: { revalidate: 3600 },
  });
}
