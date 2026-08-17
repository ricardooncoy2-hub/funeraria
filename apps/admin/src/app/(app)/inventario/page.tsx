"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ClipboardEdit } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createTableColumns, DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdjustmentModal } from "@/components/inventario/adjustment-modal";
import { KardexModal } from "@/components/inventario/kardex-modal";
import { useAuthorizedBranches } from "@/lib/api/use-branches";
import { ApiError } from "@/lib/api/client";
import { type InventoryRow, fetchLowStock, fetchStock } from "@/lib/api/inventory";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";

const columnHelper = createTableColumns<InventoryRow>();

export default function InventarioPage() {
  const user = useAuthStore((s) => s.user);
  const canAdjust = hasPermission(user, "inventario.ajustar");
  const { branches } = useAuthorizedBranches();

  const [sedeId, setSedeId] = useState<string>("");
  const [view, setView] = useState<"todo" | "bajo">("todo");
  const [page, setPage] = useState(1);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [kardexRow, setKardexRow] = useState<InventoryRow | null>(null);
  const queryClient = useQueryClient();

  const stockQuery = useQuery({
    queryKey: ["inventarios", { sedeId, page }],
    queryFn: () => fetchStock({ sedeId: sedeId || undefined, page }),
    enabled: view === "todo",
  });

  const lowStockQuery = useQuery({
    queryKey: ["inventarios", "stock-bajo", sedeId],
    queryFn: () => fetchLowStock(sedeId || undefined),
    enabled: view === "bajo",
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["inventarios"] });
  }

  const columns = [
    columnHelper.accessor((row) => row.producto.nombre, {
      id: "producto",
      header: "Producto",
      cell: (info) => <span className="font-medium text-neutral-950">{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => row.branch.nombre, { id: "sede", header: "Sede" }),
    columnHelper.accessor("stockActual", {
      header: "Stock actual",
      cell: (info) => {
        const row = info.row.original;
        const bajo = Number(row.stockActual) <= Number(row.stockMinimo);
        return (
          <span className={`tabular-nums ${bajo ? "font-semibold text-warning-700" : "text-neutral-950"}`}>
            {info.getValue()}
            {bajo && <AlertTriangle className="ml-1 inline size-3.5" aria-label="Stock bajo" />}
          </span>
        );
      },
    }),
    columnHelper.accessor("stockMinimo", { header: "Stock mínimo", cell: (info) => <span className="tabular-nums">{info.getValue()}</span> }),
    columnHelper.accessor("costoPromedio", {
      header: "Costo promedio",
      cell: (info) => <span className="tabular-nums">S/ {Number(info.getValue()).toFixed(2)}</span>,
    }),
    columnHelper.display({
      id: "acciones",
      header: "Acciones",
      cell: (info) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setKardexRow(info.row.original)}>
            Ver kardex
          </Button>
        </div>
      ),
    }),
  ];

  const data = view === "todo" ? (stockQuery.data?.data ?? []) : (lowStockQuery.data ?? []);
  const isLoading = view === "todo" ? stockQuery.isLoading : lowStockQuery.isLoading;
  const isError = view === "todo" ? stockQuery.isError : lowStockQuery.isError;
  const errorMessage =
    (view === "todo" ? stockQuery.error : lowStockQuery.error) instanceof ApiError
      ? ((view === "todo" ? stockQuery.error : lowStockQuery.error) as ApiError).message
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-950">Inventario</h1>
          <p className="mt-1 text-sm text-neutral-700">Stock por sede, kardex y ajustes (RF-040/043/045).</p>
        </div>
        {canAdjust && (
          <Button onClick={() => setAdjustmentOpen(true)}>
            <ClipboardEdit className="size-4" aria-hidden />
            Nuevo ajuste
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-neutral-300 p-0.5">
          <button
            type="button"
            onClick={() => { setView("todo"); setPage(1); }}
            className={`rounded px-3 py-1.5 text-sm font-medium ${view === "todo" ? "bg-brand-600 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
          >
            Todo el stock
          </button>
          <button
            type="button"
            onClick={() => setView("bajo")}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium ${view === "bajo" ? "bg-brand-600 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
          >
            <AlertTriangle className="size-3.5" aria-hidden />
            Stock bajo
          </button>
        </div>

        <div className="w-56">
          <Select value={sedeId || "__all__"} onValueChange={(v) => { setSedeId(v === "__all__" ? "" : v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Todas mis sedes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas mis sedes</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        emptyTitle={view === "bajo" ? "No hay productos en stock bajo" : "Sin registros de inventario"}
        emptyDescription={
          view === "bajo"
            ? "Todos los productos están por encima de su stock mínimo."
            : undefined
        }
      />

      {view === "todo" && stockQuery.data && <Pagination meta={stockQuery.data.meta} onPageChange={setPage} />}

      {adjustmentOpen && (
        <AdjustmentModal open={adjustmentOpen} onOpenChange={setAdjustmentOpen} onSuccess={refetch} />
      )}

      {kardexRow && (
        <KardexModal
          open={!!kardexRow}
          onOpenChange={(open) => !open && setKardexRow(null)}
          sedeId={kardexRow.sedeId}
          productoId={kardexRow.productoId}
          productoNombre={kardexRow.producto.nombre}
        />
      )}
    </div>
  );
}
