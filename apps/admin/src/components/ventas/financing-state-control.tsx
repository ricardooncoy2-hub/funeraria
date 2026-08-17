"use client";

import { useState } from "react";
import { EstadoBadge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { setFinancingStatus } from "@/lib/api/financing";
import { toast } from "@/lib/toast/toast-store";

/** docs/21 §21.4 — solo FINANCIADOR tiene ciclo institucional; CLIENTE es automático vía pagos. */
const FINANCIADOR_TRANSITIONS: Record<string, string[]> = {
  PENDIENTE: ["DOCUMENTADA", "CANCELADA"],
  DOCUMENTADA: ["ENVIADA", "CANCELADA"],
  ENVIADA: ["OBSERVADA", "APROBADA", "RECHAZADA", "CANCELADA"],
  OBSERVADA: ["ENVIADA", "CANCELADA"],
  APROBADA: ["CANCELADA"],
};

export function FinancingStateControl({
  id,
  origenTipo,
  estado,
  onChanged,
}: {
  id: string;
  origenTipo: "CLIENTE" | "FINANCIADOR";
  estado: string;
  onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const transitions = origenTipo === "FINANCIADOR" ? (FINANCIADOR_TRANSITIONS[estado] ?? []) : [];

  async function handleChange(next: string) {
    setSaving(true);
    try {
      await setFinancingStatus(id, next);
      toast.success(`Financiamiento actualizado a ${next}.`);
      onChanged();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo cambiar el estado.");
    } finally {
      setSaving(false);
    }
  }

  if (transitions.length === 0) {
    return <EstadoBadge estado={estado} />;
  }

  return (
    <div className="flex items-center gap-2">
      <EstadoBadge estado={estado} />
      <Select value="" onValueChange={handleChange}>
        <SelectTrigger className="h-7 w-36 px-2 py-1 text-xs" disabled={saving}>
          <SelectValue placeholder="Cambiar a…" />
        </SelectTrigger>
        <SelectContent>
          {transitions.map((t) => (
            <SelectItem key={t} value={t}>
              {t.replaceAll("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
