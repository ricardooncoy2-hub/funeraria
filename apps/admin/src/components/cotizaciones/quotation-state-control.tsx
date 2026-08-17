"use client";

import { useState } from "react";
import { EstadoBadge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { type QuotationState, setQuotationStatus } from "@/lib/api/quotations";
import { toast } from "@/lib/toast/toast-store";

/** docs/23 §23.3. EN_REVISION -> ASIGNADA se excluye a propósito: esa
 * transición solo debe ocurrir vía POST /asignar (requiere sede), nunca como
 * cambio de estado libre. */
const TRANSITIONS: Record<QuotationState, QuotationState[]> = {
  SOLICITADA: ["EN_REVISION", "VENCIDA", "CANCELADA"],
  EN_REVISION: ["CANCELADA"],
  ASIGNADA: ["CONTACTADA", "VENCIDA", "CANCELADA"],
  CONTACTADA: ["EN_NEGOCIACION", "CANCELADA"],
  EN_NEGOCIACION: ["ACEPTADA", "RECHAZADA", "CANCELADA"],
  ACEPTADA: [],
  RECHAZADA: [],
  VENCIDA: [],
  CANCELADA: [],
};

export function QuotationStateControl({
  id,
  estado,
  onChanged,
}: {
  id: string;
  estado: QuotationState;
  onChanged: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const transitions = TRANSITIONS[estado] ?? [];

  async function handleChange(next: string) {
    setSaving(true);
    try {
      await setQuotationStatus(id, next as QuotationState);
      toast.success(`Cotización actualizada a ${next}.`);
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
        <SelectTrigger className="h-7 w-40 px-2 py-1 text-xs" disabled={saving}>
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
