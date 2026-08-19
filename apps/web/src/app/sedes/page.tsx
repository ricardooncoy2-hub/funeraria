import type { Metadata } from "next";
import { BranchCard } from "@/components/cards/branch-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { fetchSedes, type Sede } from "@/lib/api/sedes";

export const metadata: Metadata = {
  title: "Sedes",
  description: "Ubicación, teléfono y horario de las sedes de Funeraria Minaya.",
  alternates: { canonical: "/sedes" },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** CA-SEO-03: JSON-LD `LocalBusiness` por sede, solo cuando el NAP está completo. */
function localBusinessJsonLd(sede: Sede) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Funeraria Minaya — ${sede.nombre}`,
    telephone: sede.telefono,
    url: `${SITE_URL}/sedes`,
    address: {
      "@type": "PostalAddress",
      streetAddress: sede.direccion,
      addressLocality: sede.distrito?.nombre,
      addressRegion: sede.distrito?.provincia.departamento.nombre,
      addressCountry: "PE",
    },
  };
}

/**
 * Toda la información (dirección, teléfono, mapa) va inline en esta misma
 * página — sin ruta de detalle por sede (SKILL.md §20.3: "sin obligarlo a
 * navegar varias pantallas"; decisión de la Fase 7, ver plan §Contexto).
 */
export default async function SedesPage() {
  const sedes = await fetchSedes();
  const sedesConNapCompleto = sedes.filter((s) => s.direccion && s.telefono);

  return (
    <>
      {sedesConNapCompleto.map((sede) => (
        <JsonLd key={sede.id} data={localBusinessJsonLd(sede)} />
      ))}
      <PageHeader
        title="Nuestras sedes"
        description="Visítenos o comuníquese con la sede más cercana a usted."
      />
      <Container className="py-16">
        {sedes.length === 0 ? (
          <p className="text-neutral-500">Aún no hay sedes publicadas.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sedes.map((sede) => (
              <BranchCard key={sede.id} sede={sede} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
