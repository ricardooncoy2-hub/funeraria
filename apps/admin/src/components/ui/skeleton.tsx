import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** SKILL.md §18 — loading de página/tabla: bloques con la forma aproximada del contenido. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-neutral-200", className)}
      role="presentation"
      {...props}
    />
  );
}
