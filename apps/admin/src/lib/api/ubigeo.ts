import { apiFetch } from "./client";

export interface Departamento {
  id: string;
  codigo: string;
  nombre: string;
}

export interface Provincia {
  id: string;
  codigo: string;
  nombre: string;
  departamentoId: string;
}

export interface Distrito {
  id: string;
  codigo: string;
  nombre: string;
  provinciaId: string;
}

export interface DistritoConCadena extends Distrito {
  provincia: Provincia & { departamento: Departamento };
}

export async function fetchDepartamentos(): Promise<Departamento[]> {
  return apiFetch<Departamento[]>("/ubigeo/departamentos");
}

export async function fetchProvincias(departamentoId: string): Promise<Provincia[]> {
  const search = new URLSearchParams({ departamentoId });
  return apiFetch<Provincia[]>(`/ubigeo/provincias?${search.toString()}`);
}

export async function fetchDistritos(provinciaId: string): Promise<Distrito[]> {
  const search = new URLSearchParams({ provinciaId });
  return apiFetch<Distrito[]>(`/ubigeo/distritos?${search.toString()}`);
}

export async function fetchDistrito(id: string): Promise<DistritoConCadena> {
  return apiFetch<DistritoConCadena>(`/ubigeo/distritos/${id}`);
}
