"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;

export function SelectTrigger({
  className,
  children,
  invalid,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & { invalid?: boolean }) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        "data-[placeholder]:text-neutral-500",
        invalid && "border-danger-600",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-4 text-neutral-500" aria-hidden />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export const SelectValue = SelectPrimitive.Value;

export function SelectContent({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          "z-50 max-h-72 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-md",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-neutral-950 outline-none data-[highlighted]:bg-neutral-100",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4 text-brand-600" aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
