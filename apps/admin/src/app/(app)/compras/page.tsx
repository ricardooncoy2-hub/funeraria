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
import { type Purchase, fetchPurchases } from "@/lib/api/purchases";

const columnHelper = createTableColumns<Purchase>();

export default function ComprasPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["compras", { page }],
    queryFn: () => fetchPurchases({ page }),
  });

  const columns = [
    columnHelper.accessor("fecha", {
      header: "Fecha",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("es-PE"),
    }),
    columnHelper.accessor((row) => row.proveedor.razonSocial, {
      id: "proveedor",
      header: "Proveedor",
      cell: (info) => <span className="font-medium text-neutral-950">{info.getValue()}</span>,
    }),
    columnHelper.accessor("numeroDocumento", {
      header: "N.° documento",
      cell: (info) => info.getValue() || <span className="text-neutral-400">—</span>,
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
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/compras/${info.row.original.id}`);
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
          <h1 className="text-3xl font-semibold text-neutral-950">Compras</h1>
          <p className="mt-1 text-sm text-neutral-700">Compras centralizadas en la sede principal (RF-053).</p>
        </div>
        <Button onClick={() => router.push("/compras/nueva")}>
          <Plus className="size-4" aria-hidden />
          Nueva compra
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle="Aún no hay compras registradas"
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}
    </div>
  );
}
