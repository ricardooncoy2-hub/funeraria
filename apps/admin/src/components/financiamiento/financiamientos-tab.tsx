"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { createTableColumns, DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancingStateControl } from "@/components/ventas/financing-state-control";
import { ApiError } from "@/lib/api/client";
import { type FinancingRow, fetchAllFinanciadores, fetchFinancings } from "@/lib/api/financing";

const FINANCING_STATES = [
  "PENDIENTE",
  "DOCUMENTADA",
  "ENVIADA",
  "OBSERVADA",
  "APROBADA",
  "RECHAZADA",
  "PARCIALMENTE_PAGADA",
  "PAGADA",
  "CANCELADA",
] as const;

const columnHelper = createTableColumns<FinancingRow>();

export function FinanciamientosTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<string>("");
  const [financiadorId, setFinanciadorId] = useState<string>("");
  const [page, setPage] = useState(1);

  const financiadoresQuery = useQuery({ queryKey: ["financiadores", "all"], queryFn: fetchAllFinanciadores });
  const query = useQuery({
    queryKey: ["financiamientos", { estado, financiadorId, page }],
    queryFn: () => fetchFinancings({ estado: estado || undefined, financiadorId: financiadorId || undefined, page }),
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["financiamientos"] });
  }

  const columns = [
    columnHelper.accessor((row) => row.venta.codigo, {
      id: "venta",
      header: "Venta",
      cell: (info) => (
        <button
          type="button"
          className="font-medium text-brand-700 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/ventas/${info.row.original.venta.id}`);
          }}
        >
          {info.getValue()}
        </button>
      ),
    }),
    columnHelper.accessor((row) => (row.origenTipo === "CLIENTE" ? "Cliente" : (row.financiador?.nombre ?? "Institución")), {
      id: "origen",
      header: "Origen",
    }),
    columnHelper.accessor("monto", {
      header: "Monto",
      cell: (info) => <span className="tabular-nums">S/ {Number(info.getValue()).toFixed(2)}</span>,
    }),
    columnHelper.accessor("estado", {
      header: "Estado",
      cell: (info) => (
        <FinancingStateControl
          id={info.row.original.id}
          origenTipo={info.row.original.origenTipo}
          estado={info.getValue()}
          onChanged={refetch}
        />
      ),
    }),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="filtro-estado">Estado</Label>
          <Select value={estado} onValueChange={(v) => { setEstado(v === "todos" ? "" : v); setPage(1); }}>
            <SelectTrigger id="filtro-estado">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {FINANCING_STATES.map((e) => (
                <SelectItem key={e} value={e}>
                  {e.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filtro-financiador">Financiador</Label>
          <Select value={financiadorId} onValueChange={(v) => { setFinanciadorId(v === "todos" ? "" : v); setPage(1); }}>
            <SelectTrigger id="filtro-financiador">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {(financiadoresQuery.data ?? []).map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle="No hay financiamientos que coincidan con los filtros"
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}
    </div>
  );
}
