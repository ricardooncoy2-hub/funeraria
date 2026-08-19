import Link from "next/link";
import { ServiceCard } from "@/components/cards/service-card";
import { Container } from "@/components/ui/container";
import { fetchServicios } from "@/lib/api/servicios";

/** SKILL.md §20.1 punto 4: grid de ServiceCard — solo un adelanto, no el catálogo completo. */
export async function ServiciosDestacados() {
  const servicios = await fetchServicios();
  const destacados = servicios.slice(0, 3);

  if (destacados.length === 0) return null;

  return (
    <section className="bg-neutral-50">
      <Container className="py-16 sm:py-24">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold text-neutral-950">Nuestros servicios</h2>
          <Link href="/servicios" className="hidden text-sm font-medium text-brand-700 hover:text-brand-800 sm:block">
            Ver todos los servicios →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destacados.map((servicio) => (
            <ServiceCard key={servicio.id} servicio={servicio} />
          ))}
        </div>
        <Link href="/servicios" className="mt-8 block text-sm font-medium text-brand-700 hover:text-brand-800 sm:hidden">
          Ver todos los servicios →
        </Link>
      </Container>
    </section>
  );
}
