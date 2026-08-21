import { create } from "zustand";

export type ToastVariant = "success" | "warning" | "danger" | "info";

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (variant: ToastVariant, message: string) => void;
  dismiss: (id: string) => void;
}

/** SKILL.md §17 — auto-descarta a los 4-6s; nunca más de 3 simultáneos. */
const AUTO_DISMISS_MS = 5000;
const MAX_TOASTS = 3;

/**
 * `crypto.randomUUID()` solo existe en contextos seguros (HTTPS o
 * localhost) — en un despliegue por IP sobre HTTP plano (sin dominio
 * todavía) lanza "crypto.randomUUID is not a function", reventando
 * cualquier `toast.*()` de la app aunque la operación real ya haya sido
 * exitosa. El ID de un toast no necesita ser criptográficamente seguro,
 * solo único para poder descartarlo — un contador + timestamp alcanza.
 */
let toastSeq = 0;
function nextToastId(): string {
  toastSeq += 1;
  return `toast-${Date.now()}-${toastSeq}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (variant, message) => {
    const id = nextToastId();
    set({ toasts: [...get().toasts, { id, variant, message }].slice(-MAX_TOASTS) });
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push("success", message),
  warning: (message: string) => useToastStore.getState().push("warning", message),
  danger: (message: string) => useToastStore.getState().push("danger", message),
  info: (message: string) => useToastStore.getState().push("info", message),
};
