import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * SKILL.md §20.1 punto 2: titular en la serif de acento (Lora) + subtítulo +
 * un CTA primario (Cotizar) y uno secundario (WhatsApp). Filete dorado bajo
 * el titular. Foto real de la propia flota de Funeraria Minaya (paisaje
 * sereno de sierra, sin personas) — degradado oscuro superpuesto para que el
 * texto blanco mantenga contraste AA sobre cualquier zona de la imagen.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-900">
      <Image
        src="/fotos/hero-vehiculos-sierra.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-950/85 via-brand-950/60 to-brand-950/20" aria-hidden />
      <Container className="relative flex flex-col items-start gap-6 py-20 sm:py-28">
        <h1 className="max-w-2xl font-serif-accent text-4xl font-semibold text-white sm:text-5xl">
          Acompañamos a su familia con calidez, respeto y cercanía
        </h1>
        <div className="h-1 w-16 bg-gold-500" aria-hidden />
        <p className="max-w-xl text-lg text-brand-50">
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
