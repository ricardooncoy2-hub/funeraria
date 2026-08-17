"use client";

import { AlertTriangle, CheckCircle2, Info, XCircle, X } from "lucide-react";
import { type ToastVariant, useToastStore } from "@/lib/toast/toast-store";
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

/** SKILL.md §17 — esquina superior derecha en desktop, ancho completo arriba en mobile. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:top-4 sm:right-4 sm:items-end">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "flex w-full max-w-sm items-start gap-2 rounded-md border px-4 py-3 text-sm shadow-md sm:w-auto",
              STYLES[t.variant],
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="flex-1">{t.message}</p>
            <button
              type="button"
              aria-label="Descartar"
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
