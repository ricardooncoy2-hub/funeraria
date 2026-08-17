import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginatedResult } from "@/lib/api/types";
import { Button } from "./button";

/** SKILL.md §14 — paginación server-side al pie de la tabla. */
export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginatedResult<unknown>["meta"];
  onPageChange: (page: number) => void;
}) {
  if (meta.total === 0) return null;
  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm text-neutral-700">
      <span>
        {from}–{to} de {meta.total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <span className="text-neutral-500">
          Página {meta.page} de {meta.totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
