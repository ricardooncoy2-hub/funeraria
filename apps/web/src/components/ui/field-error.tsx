import { AlertCircle } from "lucide-react";

/** Mensaje de error de campo — SKILL.md §13: siempre con ícono, nunca solo color. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-danger-600">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
