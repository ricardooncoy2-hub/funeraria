"use client";

import { TransferForm } from "@/components/transferencias/transfer-form";

export default function NuevaTransferenciaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-950">Nueva transferencia</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Queda en SOLICITADA sin efecto en inventario hasta que se apruebe y envíe.
        </p>
      </div>
      <TransferForm />
    </div>
  );
}
