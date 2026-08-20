import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Conozca la historia, los valores y la cobertura de Funeraria Minaya.",
  alternates: { canonical: "/nosotros" },
};

const VALORES = [
  {
    titulo: "Respeto",
    descripcion: "Tratamos a cada familia y a cada persona fallecida con la dignidad que merece.",
  },
  {
    titulo: "Cercanía",
    descripcion: "Acompañamos, escuchamos y explicamos cada paso sin tecnicismos ni apuros.",
  },
  {
    titulo: "Profesionalismo",
    descripcion: "Cada detalle se coordina con cuidado, puntualidad y responsabilidad.",
  },
];

export default function NosotrosPage() {
  return (
    <>
      <PageHeader title="Nosotros" />
      <Container className="flex max-w-2xl flex-col gap-10 py-16">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-neutral-950">Nuestra historia</h2>
          <p className="text-neutral-700">
            Funeraria Minaya nació del compromiso de ofrecer un servicio funerario cercano y
            confiable, en el que cada familia se sienta acompañada y bien informada en un momento
            difícil. Con el tiempo, ampliamos nuestra cobertura a distintas sedes para estar cerca
            de más familias, sin perder el trato personal que nos caracteriza desde el primer día.
          </p>
        </section>

        <figure>
          <Image
            src="/fotos/nosotros-equipo-flota.jpg"
            alt="Equipo y unidades de traslado de Funeraria Minaya"
            width={960}
            height={640}
            className="w-full rounded-lg object-cover"
          />
          <figcaption className="mt-2 text-xs text-neutral-500">
            Parte de nuestro equipo y flota de traslado.
          </figcaption>
        </figure>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-neutral-950">Nuestros valores</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {VALORES.map((valor) => (
              <div key={valor.titulo}>
                <h3 className="font-semibold text-neutral-950">{valor.titulo}</h3>
                <p className="mt-1 text-sm text-neutral-700">{valor.descripcion}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-neutral-950">Cobertura</h2>
          <p className="text-neutral-700">
            Atendemos a través de varias sedes, con disponibilidad las 24 horas del día, todos los
            días del año. Puede conocer la ubicación y los datos de contacto de cada una en la
            sección de{" "}
            <Link href="/sedes" className="font-medium text-brand-700 hover:underline">
              sedes
            </Link>
            .
          </p>
        </section>
      </Container>
    </>
  );
}
