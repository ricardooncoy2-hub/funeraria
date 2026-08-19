import { Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api/client";
import { fetchPlan } from "@/lib/api/planes";
import { formatMoney } from "@/lib/format";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** `cache()` memoiza por request — ver nota en `servicios/[codigo]/page.tsx`. */
const getPlan = cache(async (codigo: string) => {
  try {
    return await fetchPlan(codigo);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ codigo: string }> }): Promise<Metadata> {
  const { codigo } = await params;
  const plan = await getPlan(codigo);
  return {
    title: plan.nombre,
    description: plan.descripcion ?? `${plan.nombre} — Funeraria Minaya.`,
    alternates: { canonical: `/planes/${codigo}` },
  };
}

export default async function PlanDetallePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const plan = await getPlan(codigo);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Planes", item: `${SITE_URL}/planes` },
      { "@type": "ListItem", position: 3, name: plan.nombre, item: `${SITE_URL}/planes/${codigo}` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <PageHeader title={plan.nombre} />
      <Container className="max-w-2xl py-16">
        {plan.descripcion && <p className="text-neutral-700">{plan.descripcion}</p>}
        <p className="mt-6 text-2xl font-semibold text-brand-700">{formatMoney(plan.precio)}</p>

        {plan.items.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-neutral-700 uppercase">
              Este plan incluye
            </h2>
            <ul className="flex flex-col gap-2">
              {plan.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-neutral-950">
                  <Check className="size-4 shrink-0 text-brand-600" aria-hidden />
                  {item.producto?.nombre ?? item.servicio?.nombre}
                  {Number(item.cantidad) > 1 && (
                    <span className="text-sm text-neutral-500">× {item.cantidad}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ButtonLink href={`/cotizacion?plan=${plan.id}`} size="lg" className="mt-8">
          Solicitar cotización
        </ButtonLink>
      </Container>
    </>
  );
}
