import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Plantilla de impresión A4 compartida por cotizaciones, ventas e
 * inventario (SKILL.md §10.4). Vive siempre en el DOM junto a la vista
 * operativa normal (`Card`s, tablas) pero permanece `hidden` en pantalla —
 * solo se vuelve visible bajo `@media print` (`print:block`), así que nunca
 * hay que sincronizar dos copias de datos ni condicionar el render por
 * `window.matchMedia`.
 */
export function PrintDocument({
  title,
  code,
  fecha,
  sede,
  disclaimer,
  children,
}: {
  /** Tipo de documento, p. ej. "Cotización", "Comprobante interno de venta", "Reporte de inventario". */
  title: string;
  code: string;
  fecha: string;
  sede?: string;
  /** Aviso legal/aclaración al pie (p. ej. "no es comprobante de pago tributario"). */
  disclaimer?: string;
  children: ReactNode;
}) {
  return (
    <div className="hidden print:block print:text-neutral-950">
      <header className="mb-6 flex items-start justify-between gap-6 border-b-2 border-brand-600 pb-4">
        <Image src="/logo-minaya.png" alt="Funeraria Minaya" width={150} height={40} />
        <div className="text-right">
          <p className="text-xl font-semibold text-neutral-950">{title}</p>
          <p className="text-sm text-neutral-700">{code}</p>
          <p className="text-sm text-neutral-700">{fecha}</p>
          {sede && <p className="text-sm text-neutral-700">{sede}</p>}
        </div>
      </header>

      <div className="flex flex-col gap-5 text-sm">{children}</div>

      {disclaimer && <p className="mt-8 border-t border-neutral-300 pt-3 text-xs text-neutral-500">{disclaimer}</p>}
    </div>
  );
}

/** Sección con rótulo dentro de un `PrintDocument` — equivalente impreso de un `Card` con título. */
export function PrintSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold tracking-wide text-neutral-700 uppercase">{title}</h2>
      {children}
    </section>
  );
}

/** Grid de pares label/valor — para datos de encabezado (solicitante, cliente, sede, vendedor, etc.). */
export function PrintFields({ fields }: { fields: { label: string; value: ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
      {fields.map((f) => (
        <div key={f.label}>
          <p className="text-xs text-neutral-500">{f.label}</p>
          <p className="font-medium text-neutral-950">{f.value}</p>
        </div>
      ))}
    </div>
  );
}
