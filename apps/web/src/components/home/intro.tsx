import { Container } from "@/components/ui/container";

/** SKILL.md §20.1 punto 3: 2-3 frases empáticas en primera persona, amplio espacio en blanco. */
export function Intro() {
  return (
    <section className="bg-white">
      <Container className="max-w-3xl py-16 text-center sm:py-24">
        <p className="text-xl leading-relaxed text-neutral-700">
          Sabemos que este es un momento difícil. Por eso, en Funeraria Minaya nos ocupamos de cada
          detalle con calma y profesionalismo, para que usted pueda concentrarse en acompañar a su
          familia. Estamos disponibles cuando nos necesite.
        </p>
      </Container>
    </section>
  );
}
