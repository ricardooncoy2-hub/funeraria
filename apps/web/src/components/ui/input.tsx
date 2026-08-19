import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid}
    className={cn(
      "h-10 w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 placeholder:text-neutral-500",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
      "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
      invalid && "border-danger-600",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
