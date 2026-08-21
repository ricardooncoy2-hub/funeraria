import { MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { QuotationForm } from "@/components/forms/quotation-form";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { fetchPlanes } from "@/lib/api/planes";
import { fetchSedes } from "@/lib/api/sedes";
import { WHATSAPP_NUMBER } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbanos, llámenos o complete el formulario — estamos disponibles las 24 horas.",
  alternates: { canonical: "/contacto" },
};

export default async function ContactoPage() {
  const [sedes, planes] = await Promise.all([fetchSedes(), fetchPlanes()]);
  const sedesConTelefono = sedes.filter((s) => s.telefono);

  return (
    <>
      <PageHeader
        title="Contacto"
        description="Estamos disponibles las 24 horas, todos los días. Elija la vía que le resulte más cómoda."
      />
      <Container className="grid grid-cols-1 gap-12 py-16 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuotationForm sedes={sedes} planes={planes} />
        </div>

        <aside className="flex flex-col gap-6">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-5 hover:border-brand-300"
          >
            <MessageCircle className="size-6 shrink-0 text-brand-600" aria-hidden />
            <div>
              <p className="font-medium text-neutral-950">WhatsApp</p>
              <p className="text-sm text-neutral-700">Respuesta rápida, disponible 24/7</p>
            </div>
          </a>

          {sedesConTelefono.length > 0 && (
            <div className="rounded-lg border border-neutral-200 bg-white p-5">
              <p className="mb-3 flex items-center gap-2 font-medium text-neutral-950">
                <Phone className="size-4 shrink-0 text-brand-600" aria-hidden />
                Teléfonos por sede
              </p>
              <ul className="flex flex-col gap-2 text-sm text-neutral-700">
                {sedesConTelefono.map((sede) => (
                  <li key={sede.id} className="flex justify-between gap-2">
                    <span>{sede.nombre}</span>
                    <a href={`tel:${sede.telefono}`} className="font-medium hover:text-brand-700">
                      {sede.telefono}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href="/sedes"
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-5 hover:border-brand-300"
          >
            <MapPin className="size-6 shrink-0 text-brand-600" aria-hidden />
            <div>
              <p className="font-medium text-neutral-950">Nuestras sedes</p>
              <p className="text-sm text-neutral-700">Dirección y mapa de cada ubicación</p>
            </div>
          </Link>
        </aside>
      </Container>
    </>
  );
}
