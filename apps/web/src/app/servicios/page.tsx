import type { Metadata } from "next";
import { ServiceCard } from "@/components/cards/service-card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { fetchServicios } from "@/lib/api/servicios";

export const metadata: Metadata = {
  title: "Servicios",
  description: "Conozca nuestros servicios funerarios: velatorio, cremación, traslados y más.",
  alternates: { canonical: "/servicios" },
};

export default async function ServiciosPage() {
  const servicios = await fetchServicios();

  return (
    <>
      <PageHeader
        title="Nuestros servicios"
        description="Acompañamos a su familia en cada etapa, con la atención y el respeto que merece."
      />
      <Container className="py-16">
        {servicios.length === 0 ? (
          <p className="text-neutral-500">Aún no hay servicios publicados.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {servicios.map((servicio) => (
              <ServiceCard key={servicio.id} servicio={servicio} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
