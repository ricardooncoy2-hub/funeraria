import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas a las dudas más comunes sobre nuestros servicios, planes y trámites.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

const FAQ = [
  {
    pregunta: "¿Atienden las 24 horas?",
    respuesta: "Sí, nuestro equipo está disponible en todo momento, todos los días del año.",
  },
  {
    pregunta: "¿Qué documentos necesito para iniciar el trámite?",
    respuesta:
      "Generalmente el DNI del fallecido, el DNI del familiar a cargo y el certificado médico de defunción. Si no cuenta con alguno todavía, comuníquese con nosotros y lo orientamos.",
  },
  {
    pregunta: "¿Puedo pagar el servicio en cuotas?",
    respuesta:
      "Sí, ofrecemos financiamiento propio y trabajamos con distintas coberturas institucionales (EsSalud, SIS, aseguradoras). Converse con nosotros para revisar las opciones disponibles en su caso.",
  },
  {
    pregunta: "¿Qué incluye un plan a futuro?",
    respuesta:
      "Cada plan agrupa un conjunto de productos y servicios (ataúd, velatorio, traslados, trámites, entre otros). Puede ver el detalle exacto de cada uno en la sección de planes.",
  },
  {
    pregunta: "¿Atienden en todas las provincias?",
    respuesta:
      "Contamos con varias sedes — puede revisar la ubicación y cobertura de cada una en la sección de sedes. Si su ubicación no aparece, escríbanos y le indicamos cómo podemos ayudarlo.",
  },
  {
    pregunta: "¿Cómo solicito una cotización?",
    respuesta:
      "Puede completar el formulario de cotización en este sitio, escribirnos por WhatsApp, o llamar directamente a la sede más cercana.",
  },
  {
    pregunta: "¿Qué pasa con mis datos si envío el formulario?",
    respuesta:
      "Solo los usamos para atender su solicitud. Puede revisar el detalle completo en nuestra política de privacidad.",
  },
];

export default function PreguntasFrecuentesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.pregunta,
      acceptedAnswer: { "@type": "Answer", text: item.respuesta },
    })),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHeader title="Preguntas frecuentes" />
      <Container className="max-w-3xl py-16">
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
      </Container>
    </>
  );
}
