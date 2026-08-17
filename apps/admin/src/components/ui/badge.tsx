import { type VariantProps, cva } from "class-variance-authority";
import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Pastilla de estado — SKILL.md §18. Nunca fondo sólido saturado. */
const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      success: "bg-success-100 text-success-700",
      warning: "bg-warning-100 text-warning-700",
      danger: "bg-danger-100 text-danger-700",
      info: "bg-info-100 text-info-700",
      neutral: "bg-neutral-100 text-neutral-700",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** SKILL.md §3.4 — mapeo de estados de negocio a semántico. Ampliar aquí a medida
 * que se agreguen módulos, nunca inventar un color nuevo sin registrarlo primero. */
const ESTADO_VARIANT: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
  CONFIRMADA: "success",
  CONFIRMADO: "success",
  APROBADA: "success",
  PAGADA: "success",
  ABIERTA: "success",
  RECIBIDA: "success",
  PENDIENTE: "warning",
  BORRADOR: "warning",
  DOCUMENTADA: "warning",
  ENVIADA: "warning",
  OBSERVADA: "warning",
  PARCIALMENTE_PAGADA: "warning",
  EN_TRANSITO: "warning",
  ANULADA: "danger",
  ANULADO: "danger",
  RECHAZADA: "danger",
  CANCELADA: "neutral",
  CERRADA: "neutral",
  INACTIVO: "neutral",
};

export function EstadoBadge({ estado, className }: { estado: string; className?: string }) {
  return (
    <Badge variant={ESTADO_VARIANT[estado] ?? "neutral"} className={className}>
      {estado.replaceAll("_", " ")}
    </Badge>
  );
}
