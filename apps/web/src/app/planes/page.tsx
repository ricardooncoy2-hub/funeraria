import type { Metadata } from "next";
import { PlanCard } from "@/components/cards/plan-card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { fetchPlanes } from "@/lib/api/planes";

export const metadata: Metadata = {
  title: "Planes",
  description: "Planes a futuro de Funeraria Minaya — tranquilidad para usted y su familia.",
  alternates: { canonical: "/planes" },
};

export default async function PlanesPage() {
  const planes = await fetchPlanes();

  return (
    <>
      <PageHeader
        title="Planes a futuro"
        description="Contrate hoy la tranquilidad de tener todo resuelto para cuando llegue el momento."
      />
      <Container className="py-16">
        {planes.length === 0 ? (
          <p className="text-neutral-500">Aún no hay planes publicados.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {planes.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
