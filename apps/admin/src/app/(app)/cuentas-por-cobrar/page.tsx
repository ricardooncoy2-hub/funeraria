"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createTableColumns, DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { type AccountReceivableRow, fetchAccountsReceivable, fetchAllFinanciadores } from "@/lib/api/financing";
import { useAuthorizedBranches } from "@/lib/api/use-branches";

const columnHelper = createTableColumns<AccountReceivableRow>();

export default function CuentasPorCobrarPage() {
  const router = useRouter();
  const { branches } = useAuthorizedBranches();
  const [sedeId, setSedeId] = useState("");
  const [financiadorId, setFinanciadorId] = useState("");
  const [antiguedadMinima, setAntiguedadMinima] = useState("");

  const financiadoresQuery = useQuery({ queryKey: ["financiadores", "all"], queryFn: fetchAllFinanciadores });
  const query = useQuery({
    queryKey: ["cuentas-por-cobrar", { sedeId, financiadorId, antiguedadMinima }],
    queryFn: () =>
      fetchAccountsReceivable({
        sedeId: sedeId || undefined,
        financiadorId: financiadorId || undefined,
        antiguedadMinima: antiguedadMinima ? Number(antiguedadMinima) : undefined,
      }),
  });

  const rows = query.data ?? [];
  const totalPendiente = rows.reduce((acc, r) => acc + Number(r.pendiente), 0);

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
    columnHelper.accessor((row) => row.financiador?.nombre ?? "—", { id: "financiador", header: "Financiador" }),
    columnHelper.accessor("estado", { header: "Estado" }),
    columnHelper.accessor("monto", {
      header: "Monto",
      cell: (info) => <span className="tabular-nums">S/ {Number(info.getValue()).toFixed(2)}</span>,
    }),
    columnHelper.accessor("cobrado", {
      header: "Cobrado",
      cell: (info) => <span className="tabular-nums">S/ {Number(info.getValue()).toFixed(2)}</span>,
    }),
    columnHelper.accessor("pendiente", {
      header: "Pendiente",
      cell: (info) => <span className="font-medium tabular-nums text-warning-700">S/ {Number(info.getValue()).toFixed(2)}</span>,
    }),
    columnHelper.accessor("dias", {
      header: "Días",
      cell: (info) => {
        const vencido = info.row.original.vencido;
        return (
          <span className={`tabular-nums ${vencido ? "font-semibold text-danger-700" : "text-neutral-700"}`}>
            {info.getValue()}
            {vencido && <AlertTriangle className="ml-1 inline size-3.5" aria-label="Vencido" />}
          </span>
        );
      },
    }),
    columnHelper.accessor("vencido", {
      header: "",
      cell: (info) => (info.getValue() ? <Badge variant="danger">Vencido</Badge> : null),
    }),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-950">Cuentas por cobrar</h1>
          <p className="mt-1 text-sm text-neutral-700">Financiamientos con saldo pendiente, por financiador y antigüedad.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-500">Total pendiente</p>
          <p className="text-xl font-semibold text-warning-700 tabular-nums">S/ {totalPendiente.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="filtro-sede">Sede</Label>
          <Select value={sedeId} onValueChange={(v) => setSedeId(v === "todas" ? "" : v)}>
            <SelectTrigger id="filtro-sede">
              <SelectValue placeholder="Todas (autorizadas)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas (autorizadas)</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filtro-financiador">Financiador</Label>
          <Select value={financiadorId} onValueChange={(v) => setFinanciadorId(v === "todos" ? "" : v)}>
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
        <div>
          <Label htmlFor="filtro-antiguedad">Antigüedad mínima (días)</Label>
          <Input
            id="filtro-antiguedad"
            type="number"
            min="0"
            placeholder="Ej. 30"
            value={antiguedadMinima}
            onChange={(e) => setAntiguedadMinima(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle="No hay cuentas por cobrar que coincidan con los filtros"
      />
    </div>
  );
}
