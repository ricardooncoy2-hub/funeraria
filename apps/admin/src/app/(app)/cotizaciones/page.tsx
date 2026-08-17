"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EstadoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createTableColumns, DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { QuotationFormModal } from "@/components/cotizaciones/quotation-form-modal";
import { ApiError } from "@/lib/api/client";
import { type Quotation, fetchQuotations } from "@/lib/api/quotations";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";

const columnHelper = createTableColumns<Quotation>();

export default function CotizacionesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canGestionar = hasPermission(user, "cotizaciones.gestionar");

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const query = useQuery({
    queryKey: ["cotizaciones", { page }],
    queryFn: () => fetchQuotations({ page }),
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
  }

  const columns = [
    columnHelper.accessor("codigo", {
      header: "Código",
      cell: (info) => <span className="font-medium text-neutral-950">{info.getValue()}</span>,
    }),
    columnHelper.accessor("solicitanteNombres", { header: "Solicitante" }),
    columnHelper.accessor("origen", { header: "Origen" }),
    columnHelper.accessor((row) => row.sedeAsignada?.nombre ?? row.sedePreferida?.nombre, {
      id: "sede",
      header: "Sede",
      cell: (info) => info.getValue() || <span className="text-neutral-400">Sin asignar</span>,
    }),
    columnHelper.accessor("fecha", {
      header: "Fecha",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("es-PE"),
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
              router.push(`/cotizaciones/${info.row.original.id}`);
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
          <h1 className="text-3xl font-semibold text-neutral-950">Cotizaciones</h1>
          <p className="mt-1 text-sm text-neutral-700">Cotizaciones internas (WhatsApp, teléfono, presencial).</p>
        </div>
        {canGestionar && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Nueva cotización
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle="Aún no hay cotizaciones registradas"
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}

      {formOpen && <QuotationFormModal open={formOpen} onOpenChange={setFormOpen} onSuccess={refetch} />}
    </div>
  );
}
