import Link from "next/link";
import { PlanCard } from "@/components/cards/plan-card";
import { Container } from "@/components/ui/container";
import { fetchPlanes } from "@/lib/api/planes";

export async function PlanesDestacados() {
  const planes = await fetchPlanes();

  if (planes.length === 0) return null;

  return (
    <section className="bg-white">
      <Container className="py-16 sm:py-24">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold text-neutral-950">Planes a futuro</h2>
          <Link href="/planes" className="hidden text-sm font-medium text-brand-700 hover:text-brand-800 sm:block">
            Ver todos los planes →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {planes.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
        <Link href="/planes" className="mt-8 block text-sm font-medium text-brand-700 hover:text-brand-800 sm:hidden">
          Ver todos los planes →
        </Link>
      </Container>
    </section>
  );
}
