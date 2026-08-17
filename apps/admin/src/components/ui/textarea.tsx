import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid}
        className={cn(
          "w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 placeholder:text-neutral-500",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
          "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
          invalid && "border-danger-600",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
