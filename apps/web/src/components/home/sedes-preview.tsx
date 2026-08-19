import Link from "next/link";
import { BranchCard } from "@/components/cards/branch-card";
import { Container } from "@/components/ui/container";
import { fetchSedes } from "@/lib/api/sedes";

/** SKILL.md §20.1 punto 6: BranchCard con foto/dirección/teléfono/mapa. */
export async function SedesPreview() {
  const sedes = await fetchSedes();

  if (sedes.length === 0) return null;

  return (
    <section className="bg-white">
      <Container className="py-16 sm:py-24">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold text-neutral-950">Nuestras sedes</h2>
          <Link href="/sedes" className="hidden text-sm font-medium text-brand-700 hover:text-brand-800 sm:block">
            Ver todas las sedes →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sedes.slice(0, 3).map((sede) => (
            <BranchCard key={sede.id} sede={sede} />
          ))}
        </div>
      </Container>
    </section>
  );
}
