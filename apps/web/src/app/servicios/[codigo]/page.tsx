import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api/client";
import { fetchServicio } from "@/lib/api/servicios";
import { formatMoney } from "@/lib/format";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * `cache()` memoiza por request: `generateMetadata` y la página llaman a
 * `getServicio` con el mismo `codigo`, así que comparten una sola llamada
 * (y un solo `notFound()`, en vez de dispararlo dos veces desde dos sitios
 * distintos del árbol de render).
 */
const getServicio = cache(async (codigo: string) => {
  try {
    return await fetchServicio(codigo);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({
  params,
}: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const { codigo } = await params;
  const servicio = await getServicio(codigo);
  return {
    title: servicio.nombre,
    description: servicio.descripcion ?? `${servicio.nombre} — Funeraria Minaya.`,
    alternates: { canonical: `/servicios/${codigo}` },
  };
}

export default async function ServicioDetallePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const servicio = await getServicio(codigo);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Servicios", item: `${SITE_URL}/servicios` },
      { "@type": "ListItem", position: 3, name: servicio.nombre, item: `${SITE_URL}/servicios/${codigo}` },
    ],
  };

  /** docs/32_seo.md §32.4: "Service para servicios funerarios". */
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: servicio.nombre,
    description: servicio.descripcion ?? undefined,
    provider: { "@type": "LocalBusiness", name: "Funeraria Minaya" },
    areaServed: "PE",
    url: `${SITE_URL}/servicios/${codigo}`,
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={serviceJsonLd} />
      <PageHeader title={servicio.nombre} />
      <Container className="max-w-2xl py-16">
        {servicio.descripcion && <p className="text-neutral-700">{servicio.descripcion}</p>}
        <p className="mt-6 text-xl font-semibold text-brand-700">
          Desde {formatMoney(servicio.precioBase)}
        </p>
        <ButtonLink href="/cotizacion" size="lg" className="mt-8">
          Solicitar cotización
        </ButtonLink>
      </Container>
    </>
  );
}
