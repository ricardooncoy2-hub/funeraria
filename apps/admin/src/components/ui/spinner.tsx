import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** SKILL.md §18 — spinner solo dentro de botones/componentes chicos, nunca a pantalla completa
 * salvo la carga inicial de la app (ver PageSpinner). */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin text-neutral-500", className)} aria-hidden />;
}

export function PageSpinner() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center" role="status">
      <Loader2 className="size-8 animate-spin text-brand-600" aria-hidden />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
