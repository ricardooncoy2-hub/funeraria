import { ChevronDown } from "lucide-react";
import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/**
 * `<select>` nativo (no Radix) — a propósito: el formulario público solo
 * necesita dos selects de pocas opciones (sede, plan), no vale la pena la
 * dependencia extra que sí se justifica en el admin para combobox largos
 * con búsqueda.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid}
        className={cn(
          "h-10 w-full appearance-none rounded-md border border-neutral-300 bg-white px-4 py-3 pr-10 text-sm text-neutral-950",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
          "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
          invalid && "border-danger-600",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-neutral-500"
        aria-hidden
      />
    </div>
  ),
);
Select.displayName = "Select";
