import { Container } from "@/components/ui/container";

const TESTIMONIOS = [
  {
    cita:
      "En un momento tan difícil, el equipo de Funeraria Minaya se encargó de todo con mucho respeto. Estaré siempre agradecida.",
    autor: "Familia Rodríguez",
  },
  {
    cita: "Nos explicaron cada paso con calma y sin apuros. Se sintió un acompañamiento genuino, no solo un servicio.",
    autor: "Familia Salazar",
  },
  {
    cita: "El plan a futuro que contratamos nos dio mucha tranquilidad. Cuando llegó el momento, todo estaba resuelto.",
    autor: "Familia Torres",
  },
];

/** SKILL.md §20.1 punto 8: tono sobrio, sin estrellas ni insignias de "garantía". */
export function Testimonios() {
  return (
    <section className="bg-white">
      <Container className="py-16 sm:py-24">
        <h2 className="mb-10 text-3xl font-semibold text-neutral-950">Lo que dicen las familias</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {TESTIMONIOS.map((t) => (
            <figure key={t.autor} className="flex flex-col gap-4">
              <blockquote className="text-neutral-700">“{t.cita}”</blockquote>
              <figcaption className="text-sm font-medium text-neutral-950">{t.autor}</figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
