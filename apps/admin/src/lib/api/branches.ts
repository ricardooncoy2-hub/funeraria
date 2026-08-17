import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export interface Branch {
  id: string;
  codigo: string;
  nombre: string;
  isMain: boolean;
  isActive: boolean;
}

export async function fetchBranches(): Promise<Branch[]> {
  const result = await apiFetch<PaginatedResult<Branch>>("/sedes?pageSize=100");
  return result.data;
}
