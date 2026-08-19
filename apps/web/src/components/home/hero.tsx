import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * SKILL.md §20.1 punto 2: titular en la serif de acento (Lora) + subtítulo +
 * un CTA primario (Cotizar) y uno secundario (WhatsApp). Filete dorado bajo
 * el titular. Sin imagen de fondo por ahora — no hay un asset fotográfico
 * real disponible todavía (§2.3 pide fotografía serena real, nunca genérica
 * de stock elegida al azar); fondo `brand-50` sereno mientras tanto.
 */
export function Hero() {
  return (
    <section className="bg-brand-50">
      <Container className="flex flex-col items-start gap-6 py-20 sm:py-28">
        <h1 className="max-w-2xl font-serif-accent text-4xl font-semibold text-neutral-950 sm:text-5xl">
          Acompañamos a su familia con calidez, respeto y cercanía
        </h1>
        <div className="h-1 w-16 bg-gold-500" aria-hidden />
        <p className="max-w-xl text-lg text-neutral-700">
          Servicios funerarios, cremación y planes a futuro en un momento en que necesita apoyo, no
          complicaciones. Cuéntenos cómo podemos ayudarlo.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/cotizacion" size="lg">
            Solicitar cotización
          </ButtonLink>
          <ButtonLink href="/contacto" variant="secondary" size="lg">
            Hablar con nosotros
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
