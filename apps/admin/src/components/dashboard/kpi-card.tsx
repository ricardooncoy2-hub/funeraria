import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** SKILL.md §15 — card de KPI: etiqueta pequeña arriba, valor grande abajo. */
export function KpiCard({
  label,
  icon: Icon,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  hint?: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <span className="text-sm text-neutral-700">{label}</span>
        <Icon className={cn("size-6", tone === "warning" ? "text-warning-600" : "text-neutral-400")} aria-hidden />
      </div>
      <p className="mt-3 text-3xl font-semibold text-neutral-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </Card>
  );
}
