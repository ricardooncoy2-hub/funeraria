import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

/** Encabezado consistente para páginas de listado (servicios/productos/planes/sedes/etc.). */
export function PageHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="border-b border-neutral-200 bg-brand-50">
      <Container className="py-12 sm:py-16">
        <h1 className="font-serif-accent text-3xl font-semibold text-neutral-950 sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-neutral-700">{description}</p>}
      </Container>
    </div>
  );
}
