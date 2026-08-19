import { CtaBand } from "@/components/home/cta-band";
import { FaqPreview } from "@/components/home/faq-preview";
import { Hero } from "@/components/home/hero";
import { Intro } from "@/components/home/intro";
import { Pasos } from "@/components/home/pasos";
import { PlanesDestacados } from "@/components/home/planes-destacados";
import { SedesPreview } from "@/components/home/sedes-preview";
import { ServiciosDestacados } from "@/components/home/servicios-destacados";
import { Testimonios } from "@/components/home/testimonios";

/** Orden exacto SKILL.md §20.1. El footer/header/WhatsAppButton viven en el layout raíz. */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <ServiciosDestacados />
      <PlanesDestacados />
      <Pasos />
      <SedesPreview />
      <FaqPreview />
      <Testimonios />
      <CtaBand />
    </>
  );
}
