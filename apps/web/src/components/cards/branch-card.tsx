import { MapPin, Phone } from "lucide-react";
import type { Sede } from "@/lib/api/sedes";

/**
 * SKILL.md §20.3: dirección, teléfono y mapa visibles sin obligar a navegar
 * a otra pantalla — por eso no es un enlace a una página de detalle, toda la
 * información va inline (decisión del plan de la Fase 7, ver §Contexto).
 */
export function BranchCard({ sede }: { sede: Sede }) {
  const ubicacion = [
    sede.direccion,
    sede.distrito?.nombre,
    sede.distrito?.provincia.nombre,
    sede.distrito?.provincia.departamento.nombre,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
      {ubicacion && (
        <iframe
          title={`Mapa — ${sede.nombre}`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(ubicacion)}&output=embed`}
          className="h-48 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-semibold text-neutral-950">{sede.nombre}</h3>
        {ubicacion && (
          <p className="mt-2 flex items-start gap-2 text-sm text-neutral-700">
            <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-500" aria-hidden />
            {ubicacion}
          </p>
        )}
        {sede.telefono && (
          <p className="mt-2 flex items-center gap-2 text-sm text-neutral-700">
            <Phone className="size-4 shrink-0 text-neutral-500" aria-hidden />
            <a href={`tel:${sede.telefono}`} className="hover:text-brand-700">
              {sede.telefono}
            </a>
          </p>
        )}
        {!ubicacion && !sede.telefono && (
          <p className="mt-2 text-sm text-neutral-500">Escríbanos para más información de esta sede.</p>
        )}
      </div>
    </div>
  );
}
