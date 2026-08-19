import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Servicio } from "@/lib/api/servicios";

/** SKILL.md §15/§20.1: borde superior dorado fino, un solo CTA al pie. */
export function ServiceCard({ servicio }: { servicio: Servicio }) {
  return (
    <Link
      href={`/servicios/${servicio.codigo}`}
      className="group flex flex-col rounded-lg border border-t-2 border-neutral-200 border-t-gold-500 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-neutral-950">{servicio.nombre}</h3>
      {servicio.descripcion && (
        <p className="mt-2 line-clamp-3 text-sm text-neutral-700">{servicio.descripcion}</p>
      )}
      <p className="mt-4 font-semibold text-brand-700">Desde {formatMoney(servicio.precioBase)}</p>
      <span className="mt-4 text-sm font-medium text-brand-600 group-hover:text-brand-700">
        Ver más →
      </span>
    </Link>
  );
}
