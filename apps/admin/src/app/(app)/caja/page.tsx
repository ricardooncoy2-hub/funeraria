"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createTableColumns, DataTable } from "@/components/ui/data-table";
import { OpenCashModal } from "@/components/caja/open-cash-modal";
import { ApiError } from "@/lib/api/client";
import { type Cash, fetchCajas } from "@/lib/api/cash";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";

const columnHelper = createTableColumns<Cash>();

export default function CajaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canOperar = hasPermission(user, "caja.operar");
  const [opening, setOpening] = useState<Cash | null>(null);

  const query = useQuery({ queryKey: ["cajas"], queryFn: () => fetchCajas() });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["cajas"] });
  }

  const columns = [
    columnHelper.accessor("nombre", {
      header: "Caja",
      cell: (info) => <span className="font-medium text-neutral-950">{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => row.openings[0]?.saldoInicial, {
      id: "estado",
      header: "Estado",
      cell: (info) => {
        const abierta = info.row.original.openings.length > 0;
        return <Badge variant={abierta ? "success" : "neutral"}>{abierta ? "Abierta" : "Cerrada"}</Badge>;
      },
    }),
    columnHelper.display({
      id: "acciones",
      header: "Acciones",
      cell: (info) => {
        const caja = info.row.original;
        const apertura = caja.openings[0];
        return (
          <div className="flex justify-end">
            {apertura ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/caja/${apertura.id}`);
                }}
              >
                Ver apertura
              </Button>
            ) : (
              canOperar &&
              caja.isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpening(caja);
                  }}
                >
                  Abrir caja
                </Button>
              )
            )}
          </div>
        );
      },
    }),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-950">Caja</h1>
        <p className="mt-1 text-sm text-neutral-700">Apertura, movimientos y cierre/arqueo de las cajas autorizadas.</p>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle="No hay cajas registradas en las sedes autorizadas"
      />

      {opening && (
        <OpenCashModal
          open={!!opening}
          onOpenChange={(open) => !open && setOpening(null)}
          caja={opening}
          onSuccess={(aperturaId) => {
            refetch();
            router.push(`/caja/${aperturaId}`);
          }}
        />
      )}
    </div>
  );
}
