import { apiFetchList } from "./client";

export interface Departamento {
  id: string;
  nombre: string;
}

export interface Provincia {
  id: string;
  nombre: string;
  departamento: Departamento;
}

export interface Distrito {
  id: string;
  nombre: string;
  provincia: Provincia;
}

export interface Sede {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  isMain: boolean;
  distrito: Distrito | null;
}

export function fetchSedes(): Promise<Sede[]> {
  return apiFetchList<Sede>("/public/sedes", { next: { revalidate: 60 } });
}
