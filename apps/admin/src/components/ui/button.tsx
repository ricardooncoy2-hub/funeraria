import { type VariantProps, cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Jerarquía de botones — SKILL.md §12. Un solo `primary` por vista.
 * `link`/`edit`/`danger` son las acciones de fila en tablas (§12.1): chip con
 * fondo sutil en reposo, coloreado según el tipo de acción, para que sean
 * discernibles a simple vista sin depender del hover. `ghost` queda para
 * utilidad sin tipo semántico (íconos, quitar fila de un formulario). */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white hover:bg-brand-700",
        secondary:
          "border border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-50",
        ghost: "text-neutral-700 hover:bg-neutral-100",
        link: "bg-brand-50 text-brand-700 hover:bg-brand-100 hover:text-brand-800",
        edit: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
        danger: "bg-danger-50 text-danger-600 hover:bg-danger-100",
        destructive: "bg-danger-600 text-white hover:bg-danger-700",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
