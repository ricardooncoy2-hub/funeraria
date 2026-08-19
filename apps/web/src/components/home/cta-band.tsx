import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/** SKILL.md §20.1 punto 9: franja brand-700 con filete dorado superior, disponibilidad 24h. */
export function CtaBand() {
  return (
    <section className="border-t-4 border-gold-500 bg-brand-700">
      <Container className="flex flex-col items-center gap-4 py-16 text-center sm:py-20">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">
          Estamos disponibles las 24 horas, todos los días
        </h2>
        <p className="max-w-xl text-brand-100">
          Escríbanos o solicite una cotización sin compromiso — le responderemos a la brevedad.
        </p>
        <ButtonLink href="/cotizacion" variant="secondary" size="lg" className="mt-2">
          Solicitar cotización
        </ButtonLink>
      </Container>
    </section>
  );
}
