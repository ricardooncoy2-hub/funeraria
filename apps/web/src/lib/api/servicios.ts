import { apiFetch } from "./client";

export interface Servicio {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioBase: string;
  afectoIgv: boolean;
  imagenUrl: string | null;
}

export function fetchServicios(): Promise<Servicio[]> {
  return apiFetch<Servicio[]>("/public/servicios", { next: { revalidate: 3600 } });
}

export function fetchServicio(codigo: string): Promise<Servicio> {
  return apiFetch<Servicio>(`/public/servicios/${encodeURIComponent(codigo)}`, {
    next: { revalidate: 3600 },
  });
}
