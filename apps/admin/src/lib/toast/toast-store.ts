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

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (variant, message) => {
    const id = crypto.randomUUID();
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
