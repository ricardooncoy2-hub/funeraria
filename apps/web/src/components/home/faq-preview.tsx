import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/container";

const FAQ = [
  {
    pregunta: "¿Atienden las 24 horas?",
    respuesta: "Sí, nuestro equipo está disponible en todo momento para atender su solicitud.",
  },
  {
    pregunta: "¿Puedo pagar el servicio en cuotas?",
    respuesta:
      "Sí, ofrecemos financiamiento y trabajamos con distintas coberturas — converse con nosotros para ver las opciones disponibles.",
  },
  {
    pregunta: "¿Qué necesito para iniciar el trámite?",
    respuesta:
      "Generalmente el DNI del fallecido, el DNI del familiar a cargo y el certificado médico de defunción.",
  },
];

/**
 * Acordeón nativo (`<details>`/`<summary>`) — sin JavaScript, sigue
 * accesible por teclado y lector de pantalla sin necesitar un componente
 * cliente (SKILL.md §20.1 punto 7: recursos de duelo/FAQ corta).
 */
export function FaqPreview() {
  return (
    <section className="bg-neutral-50">
      <Container className="max-w-3xl py-16 sm:py-24">
        <h2 className="mb-10 text-3xl font-semibold text-neutral-950">Preguntas frecuentes</h2>
        <div className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {FAQ.map((item) => (
            <details key={item.pregunta} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-neutral-950">
                {item.pregunta}
                <ChevronDown
                  className="size-5 shrink-0 text-neutral-500 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-3 text-sm text-neutral-700">{item.respuesta}</p>
            </details>
          ))}
        </div>
        <Link href="/preguntas-frecuentes" className="mt-6 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">
          Ver todas las preguntas frecuentes →
        </Link>
      </Container>
    </section>
  );
}
