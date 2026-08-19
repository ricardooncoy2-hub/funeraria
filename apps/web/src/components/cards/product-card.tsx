import { Package } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Producto } from "@/lib/api/productos";

/**
 * Sin enlace a detalle propio (decisión de la Fase 7, ver plan §Contexto): el
 * sitio es informativo, los productos se consultan agrupados por categoría,
 * no como fichas individuales navegables.
 */
export function ProductCard({ producto }: { producto: Producto }) {
  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <Package className="size-8 text-brand-600" aria-hidden />
      <h3 className="mt-3 text-lg font-semibold text-neutral-950">{producto.nombre}</h3>
      {producto.descripcion && (
        <p className="mt-2 line-clamp-3 text-sm text-neutral-700">{producto.descripcion}</p>
      )}
      <p className="mt-4 font-semibold text-brand-700">{formatMoney(producto.precioVenta)}</p>
    </div>
  );
}
