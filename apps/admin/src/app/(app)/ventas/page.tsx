"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EstadoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createTableColumns, DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api/client";
import { type Sale, fetchSales } from "@/lib/api/sales";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";

const columnHelper = createTableColumns<Sale>();

export default function VentasPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canCrear = hasPermission(user, "ventas.crear");
  const [page, setPage] = useState(1);

  const query = useQuery({ queryKey: ["ventas", { page }], queryFn: () => fetchSales({ page }) });

  const columns = [
    columnHelper.accessor("codigo", {
      header: "Código",
      cell: (info) => <span className="font-medium text-neutral-950">{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => [row.cliente.nombres, row.cliente.apellidos].filter(Boolean).join(" "), {
      id: "cliente",
      header: "Cliente",
    }),
    columnHelper.accessor((row) => row.sedeVenta.codigo, { id: "sede", header: "Sede" }),
    columnHelper.accessor("fecha", {
      header: "Fecha",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("es-PE"),
    }),
    columnHelper.accessor("total", {
      header: "Total",
      cell: (info) => <span className="tabular-nums">S/ {Number(info.getValue()).toFixed(2)}</span>,
    }),
    columnHelper.accessor("estado", {
      header: "Estado",
      cell: (info) => <EstadoBadge estado={info.getValue()} />,
    }),
    columnHelper.display({
      id: "acciones",
      header: "Acciones",
      cell: (info) => (
        <div className="flex justify-end">
          <Button
            variant="link"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/ventas/${info.row.original.id}`);
            }}
          >
            Ver detalle
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-950">Ventas</h1>
          <p className="mt-1 text-sm text-neutral-700">Ventas de las sedes autorizadas.</p>
        </div>
        {canCrear && (
          <Button onClick={() => router.push("/ventas/nueva")}>
            <Plus className="size-4" aria-hidden />
            Nueva venta
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle="Aún no hay ventas registradas"
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}
    </div>
  );
}
