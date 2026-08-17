"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** SKILL.md §16 — confirmaciones (sm) y formularios cortos (md). Nunca para flujos largos. */
export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md";
}

export function Modal({ open, onOpenChange, title, children, footer, size = "sm" }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-neutral-950/50" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-md focus:outline-none",
            size === "sm" ? "max-w-[480px]" : "max-w-[640px]",
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-xl font-semibold text-neutral-950">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Cerrar"
                className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
              >
                <X className="size-5" aria-hidden />
              </button>
            </Dialog.Close>
          </div>
          <div className="text-sm text-neutral-700">{children}</div>
          {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
