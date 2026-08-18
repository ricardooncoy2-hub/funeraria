"use client";

import { Printer } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Dispara la impresión del navegador (`window.print()`) sobre lo que el CSS
 * `print:` deje visible en la página — no genera el PDF por sí mismo, el
 * usuario lo obtiene con "Guardar como PDF" del diálogo de impresión
 * (SKILL.md §10.4). El propio botón se oculta al imprimir (`print:hidden`)
 * para no aparecer en el documento.
 */
export function PrintButton({ className, variant = "secondary", ...props }: ButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => window.print()}
      className={cn("print:hidden", className)}
      {...props}
    >
      <Printer className="size-4" aria-hidden />
      Imprimir
    </Button>
  );
}
