import { apiFetchList } from "./client";

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  unidadMedida: string;
  precioVenta: string;
  afectoIgv: boolean;
  imagenUrl: string | null;
  categoria: { id: string; nombre: string };
}

export function fetchProductos(): Promise<Producto[]> {
  return apiFetchList<Producto>("/public/productos", { next: { revalidate: 60 } });
}
