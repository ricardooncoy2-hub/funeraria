import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo tratamos sus datos personales, conforme a la Ley N.° 29733.",
  alternates: { canonical: "/politica-privacidad" },
};

/** Contenido alineado a docs/17_proteccion_datos.md §17.1-17.4, 17.9 — no es asesoría legal. */
export default function PoliticaPrivacidadPage() {
  return (
    <>
      <PageHeader title="Política de privacidad" />
      <Container className="flex max-w-2xl flex-col gap-8 py-16 text-neutral-700">
        <p>
          En Funeraria Minaya tratamos sus datos personales conforme a la Ley N.° 29733 de
          Protección de Datos Personales del Perú y su reglamento. Este documento explica qué
          datos recopilamos, para qué los usamos y cómo puede ejercer sus derechos.
        </p>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-neutral-950">¿Qué datos recopilamos?</h2>
          <p>
            Cuando completa el formulario de cotización o contacto en este sitio, solicitamos
            únicamente su nombre, teléfono y, opcionalmente, su correo electrónico — los datos
            mínimos necesarios para poder comunicarnos con usted.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-neutral-950">¿Para qué los usamos?</h2>
          <p>
            Exclusivamente para atender su solicitud de cotización o consulta y ponernos en
            contacto con usted. No usamos sus datos con fines publicitarios ni los compartimos con
            terceros ajenos a la prestación del servicio.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-neutral-950">Base legal</h2>
          <p>
            Tratamos estos datos en base a su consentimiento explícito, otorgado al marcar la
            casilla correspondiente antes de enviar el formulario. Sin ese consentimiento, no
            procesamos su solicitud.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-neutral-950">Conservación</h2>
          <p>
            Si su solicitud no continúa hacia una contratación, conservamos estos datos por un
            plazo acotado y luego los eliminamos o anonimizamos. Los datos asociados a una
            contratación se conservan por el plazo que exige la normativa aplicable.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-neutral-950">Sus derechos (ARCO)</h2>
          <p>
            Usted puede solicitar en cualquier momento el acceso, rectificación, cancelación u
            oposición al tratamiento de sus datos personales. Para ejercer estos derechos,
            escríbanos por WhatsApp o a través del formulario de{" "}
            <Link href="/contacto" className="font-medium text-brand-700 hover:underline">
              contacto
            </Link>
            , indicando el derecho que desea ejercer.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-neutral-950">Seguridad</h2>
          <p>
            Sus datos viajan cifrados (HTTPS) entre su navegador y nuestros servidores, y el
            acceso interno está restringido al personal que necesita esa información para atender
            su solicitud.
          </p>
        </section>

        <p className="text-sm text-neutral-500">
          Este documento no constituye asesoría legal formal y puede actualizarse cuando cambien
          nuestras prácticas o la normativa aplicable.
        </p>
      </Container>
    </>
  );
}
