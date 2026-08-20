import { Package } from "lucide-react";
import Image from "next/image";
import { formatMoney } from "@/lib/format";
import type { Producto } from "@/lib/api/productos";

/**
 * Sin enlace a detalle propio (decisión de la Fase 7, ver plan §Contexto): el
 * sitio es informativo, los productos se consultan agrupados por categoría,
 * no como fichas individuales navegables.
 */
export function ProductCard({ producto }: { producto: Producto }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
      {producto.imagenUrl ? (
        <div className="relative h-44 w-full bg-neutral-100">
          <Image
            src={producto.imagenUrl}
            alt={producto.nombre}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain"
          />
        </div>
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-neutral-100">
          <Package className="size-10 text-neutral-400" aria-hidden />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold text-neutral-950">{producto.nombre}</h3>
        {producto.descripcion && (
          <p className="mt-2 line-clamp-3 text-sm text-neutral-700">{producto.descripcion}</p>
        )}
        <p className="mt-4 font-semibold text-brand-700">{formatMoney(producto.precioVenta)}</p>
      </div>
    </div>
  );
}
