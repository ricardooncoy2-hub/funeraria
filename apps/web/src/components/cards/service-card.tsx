import { HeartHandshake } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Servicio } from "@/lib/api/servicios";

/** SKILL.md §15/§20.1: borde superior dorado fino, un solo CTA al pie. */
export function ServiceCard({ servicio }: { servicio: Servicio }) {
  return (
    <Link
      href={`/servicios/${servicio.codigo}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-t-2 border-neutral-200 border-t-gold-500 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {servicio.imagenUrl ? (
        <div className="relative h-44 w-full bg-neutral-100">
          <Image
            src={servicio.imagenUrl}
            alt={servicio.nombre}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-neutral-100">
          <HeartHandshake className="size-10 text-neutral-400" aria-hidden />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold text-neutral-950">{servicio.nombre}</h3>
        {servicio.descripcion && (
          <p className="mt-2 line-clamp-3 text-sm text-neutral-700">{servicio.descripcion}</p>
        )}
        <p className="mt-4 font-semibold text-brand-700">Desde {formatMoney(servicio.precioBase)}</p>
        <span className="mt-4 text-sm font-medium text-brand-600 group-hover:text-brand-700">
          Ver más →
        </span>
      </div>
    </Link>
  );
}
