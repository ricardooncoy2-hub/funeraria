import type { PaginatedResult } from "./types";
import { apiFetch } from "./client";

export interface ProductCategory {
  id: string;
  nombre: string;
  descripcion: string | null;
  isActive: boolean;
}

export interface Product {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoriaProductoId: string;
  unidadMedida: string;
  precioVenta: string;
  afectoIgv: boolean;
  imagenUrl: string | null;
  isActive: boolean;
}

export interface ProductInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoriaProductoId: string;
  unidadMedida: string;
  precioVenta: number;
  afectoIgv?: boolean;
  imagenUrl?: string;
}

export async function fetchCategories() {
  return apiFetch<ProductCategory[]>("/categorias-producto");
}

export async function createCategory(input: { nombre: string; descripcion?: string }) {
  return apiFetch<ProductCategory>("/categorias-producto", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchAllProducts(): Promise<Product[]> {
  const result = await apiFetch<PaginatedResult<Product>>("/productos?pageSize=100");
  return result.data;
}

export async function fetchProducts(params: { q?: string; page?: number; pageSize?: number } = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("page", String(params.page ?? 1));
  search.set("pageSize", String(params.pageSize ?? 20));
  return apiFetch<PaginatedResult<Product>>(`/productos?${search.toString()}`);
}

export async function createProduct(input: ProductInput) {
  return apiFetch<Product>("/productos", { method: "POST", body: JSON.stringify(input) });
}

export async function updateProduct(id: string, input: Partial<ProductInput> & { isActive?: boolean }) {
  return apiFetch<Product>(`/productos/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function deactivateProduct(id: string) {
  return apiFetch<void>(`/productos/${id}`, { method: "DELETE" });
}
