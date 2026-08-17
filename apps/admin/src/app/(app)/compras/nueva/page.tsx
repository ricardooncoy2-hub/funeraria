"use client";

import { PurchaseForm } from "@/components/compras/purchase-form";

export default function NuevaCompraPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-950">Nueva compra</h1>
        <p className="mt-1 text-sm text-neutral-700">Se registra en estado BORRADOR hasta recepcionarla.</p>
      </div>
      <PurchaseForm />
    </div>
  );
}
