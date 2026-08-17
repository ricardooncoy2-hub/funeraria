import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { ToastVariant } from "@/lib/toast/toast-store";
import { cn } from "@/lib/utils";

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
};

const STYLES: Record<ToastVariant, string> = {
  success: "border-success-100 bg-success-50 text-success-700",
  warning: "border-warning-100 bg-warning-50 text-warning-700",
  danger: "border-danger-100 bg-danger-50 text-danger-700",
  info: "border-info-100 bg-info-50 text-info-700",
};

/** SKILL.md §17 — condición de estado persistente dentro del layout (no flota, no se auto-descarta). */
export function Banner({
  variant,
  children,
}: {
  variant: ToastVariant;
  children: ReactNode;
}) {
  const Icon = ICONS[variant];
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-md border px-4 py-3 text-sm", STYLES[variant])}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
    </div>
  );
}
