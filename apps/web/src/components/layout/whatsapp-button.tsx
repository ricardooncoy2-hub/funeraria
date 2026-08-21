import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/site-config";

const MENSAJE_PRELLENADO = "Hola, quisiera más información sobre sus servicios.";

/**
 * Botón flotante de WhatsApp (SKILL.md §20.3) — esquina inferior derecha,
 * mensaje prellenado, número configurable por `NEXT_PUBLIC_WHATSAPP_NUMBER`.
 * Usa `brand-600` (no el verde de marca de WhatsApp) para no introducir un
 * segundo acento — el azul sigue siendo el único color que comunica
 * interacción en todo el sitio (SKILL.md §1.5). `bottom` respeta el "safe
 * area" inferior de iOS (notch) sin depender de que exista un footer sticky
 * que lo tape.
 */
export function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MENSAJE_PRELLENADO)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 z-50 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-white shadow-md transition-colors hover:bg-brand-700 sm:right-6"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
      aria-label="Escríbenos por WhatsApp"
    >
      <MessageCircle className="size-6" aria-hidden />
      <span className="hidden text-sm font-medium sm:inline">Escríbenos</span>
    </a>
  );
}
