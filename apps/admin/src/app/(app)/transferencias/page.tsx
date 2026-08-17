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
import { type Transfer, fetchTransfers } from "@/lib/api/transfers";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";

const columnHelper = createTableColumns<Transfer>();

export default function TransferenciasPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canSolicitar = hasPermission(user, "transferencias.solicitar");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["transferencias", { page }],
    queryFn: () => fetchTransfers({ page }),
  });

  const columns = [
    columnHelper.accessor("codigo", {
      header: "Código",
      cell: (info) => <span className="font-medium text-neutral-950">{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => row.sedeOrigen.codigo, { id: "origen", header: "Origen" }),
    columnHelper.accessor((row) => row.sedeDestino.codigo, { id: "destino", header: "Destino" }),
    columnHelper.accessor("estado", {
      header: "Estado",
      cell: (info) => <EstadoBadge estado={info.getValue()} />,
    }),
    columnHelper.display({
      id: "acciones",
      header: "Acciones",
      cell: (info) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/transferencias/${info.row.original.id}`)}>
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
          <h1 className="text-3xl font-semibold text-neutral-950">Transferencias</h1>
          <p className="mt-1 text-sm text-neutral-700">Transferencias de inventario entre sedes (RF-060).</p>
        </div>
        {canSolicitar && (
          <Button onClick={() => router.push("/transferencias/nueva")}>
            <Plus className="size-4" aria-hidden />
            Nueva transferencia
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle="Aún no hay transferencias registradas"
        onRowClick={(row) => router.push(`/transferencias/${row.id}`)}
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}
    </div>
  );
}
