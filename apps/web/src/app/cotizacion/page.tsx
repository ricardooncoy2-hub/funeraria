import type { Metadata } from "next";
import { QuotationForm } from "@/components/forms/quotation-form";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { fetchPlanes } from "@/lib/api/planes";
import { fetchSedes } from "@/lib/api/sedes";

export const metadata: Metadata = {
  title: "Solicitar cotización",
  description: "Solicite una cotización sin compromiso — le responderemos a la brevedad.",
  alternates: { canonical: "/cotizacion" },
};

export default async function CotizacionPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const [sedes, planes] = await Promise.all([fetchSedes(), fetchPlanes()]);

  return (
    <>
      <PageHeader
        title="Solicitar cotización"
        description="Complete el formulario y nos pondremos en contacto a la brevedad, sin compromiso."
      />
      <Container className="max-w-2xl py-16">
        <QuotationForm sedes={sedes} planes={planes} planIdInicial={plan} />
      </Container>
    </>
  );
}
