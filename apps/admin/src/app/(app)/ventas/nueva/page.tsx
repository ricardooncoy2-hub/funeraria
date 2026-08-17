"use client";

import { SaleWizard } from "@/components/ventas/sale-wizard";

export default function NuevaVentaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-950">Nueva venta</h1>
        <p className="mt-1 text-sm text-neutral-700">Sede y cliente, ítems, financiamiento y confirmación.</p>
      </div>
      <SaleWizard />
    </div>
  );
}
