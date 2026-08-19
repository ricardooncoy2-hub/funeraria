import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Contenedor centrado del sitio público (SKILL.md §7): max-width 1200px, padding lateral responsivo. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-(--container-public) px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
