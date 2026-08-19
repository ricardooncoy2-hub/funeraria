import { Container } from "@/components/ui/container";

const PASOS = [
  {
    titulo: "Comuníquese con nosotros",
    descripcion: "Llámenos o escríbanos por WhatsApp — estamos disponibles las 24 horas.",
  },
  {
    titulo: "Reúna los documentos básicos",
    descripcion: "DNI del fallecido y del familiar a cargo, y el certificado médico de defunción si ya lo tiene.",
  },
  {
    titulo: "Elija el servicio o plan",
    descripcion: "Lo orientamos según sus necesidades y posibilidades, sin presión ni compromiso.",
  },
  {
    titulo: "Nosotros coordinamos el resto",
    descripcion: "Traslado, velatorio y trámites — usted puede concentrarse en acompañar a su familia.",
  },
];

/** SKILL.md §20.1 punto 5: pasos numerados, guía clara para un momento de urgencia. */
export function Pasos() {
  return (
    <section className="bg-brand-50">
      <Container className="py-16 sm:py-24">
        <h2 className="mb-10 text-3xl font-semibold text-neutral-950">
          ¿Qué hacer cuando alguien fallece?
        </h2>
        <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, i) => (
            <li key={paso.titulo} className="flex flex-col gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-700 text-base font-semibold text-white">
                {i + 1}
              </span>
              <h3 className="font-semibold text-neutral-950">{paso.titulo}</h3>
              <p className="text-sm text-neutral-700">{paso.descripcion}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
