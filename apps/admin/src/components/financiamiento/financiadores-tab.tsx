"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createTableColumns, DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { FinanciadorFormModal } from "@/components/financiamiento/financiador-form-modal";
import { ApiError } from "@/lib/api/client";
import { type Financiador, deactivateFinanciador, fetchFinanciadores } from "@/lib/api/financing";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";
import { toast } from "@/lib/toast/toast-store";

const columnHelper = createTableColumns<Financiador>();

export function FinanciadoresTab() {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, "financiamiento.gestionar");
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Financiador | undefined>(undefined);
  const [deactivating, setDeactivating] = useState<Financiador | null>(null);

  const query = useQuery({
    queryKey: ["financiadores", { q, page }],
    queryFn: () => fetchFinanciadores({ q: q || undefined, page }),
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["financiadores"] });
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    try {
      await deactivateFinanciador(deactivating.id);
      toast.success(`${deactivating.nombre} fue desactivado.`);
      refetch();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo desactivar el financiador.");
      throw error;
    }
  }

  const columns = [
    columnHelper.accessor("nombre", {
      header: "Nombre",
      cell: (info) => <span className="font-medium text-neutral-950">{info.getValue()}</span>,
    }),
    columnHelper.accessor("tipo", { header: "Tipo" }),
    columnHelper.accessor((row) => row.numeroDocumento, {
      id: "documento",
      header: "Documento",
      cell: (info) => info.getValue() || <span className="text-neutral-400">—</span>,
    }),
    columnHelper.accessor("diasCredito", {
      header: "Días crédito",
      cell: (info) => info.getValue() ?? <span className="text-neutral-400">—</span>,
    }),
    columnHelper.accessor("isActive", {
      header: "Estado",
      cell: (info) => <Badge variant={info.getValue() ? "success" : "neutral"}>{info.getValue() ? "Activo" : "Inactivo"}</Badge>,
    }),
    ...(canManage
      ? [
          columnHelper.display({
            id: "acciones",
            header: "Acciones",
            cell: (info) => {
              const financiador = info.row.original;
              return (
                <div className="flex justify-end gap-1">
                  <Button variant="edit" size="sm" onClick={() => { setEditing(financiador); setFormOpen(true); }}>
                    Editar
                  </Button>
                  {financiador.isActive && (
                    <Button variant="danger" size="sm" onClick={() => setDeactivating(financiador)}>
                      Desactivar
                    </Button>
                  )}
                </div>
              );
            },
          }),
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-700">SIS, EsSalud, aseguradoras y otras instituciones que financian ventas.</p>
        {canManage && (
          <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
            <Plus className="size-4" aria-hidden />
            Nuevo financiador
          </Button>
        )}
      </div>

      <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar por nombre…" />

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle={q ? "No se encontraron financiadores" : "Aún no hay financiadores registrados"}
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}

      {formOpen && (
        <FinanciadorFormModal open={formOpen} onOpenChange={setFormOpen} financiador={editing} onSuccess={refetch} />
      )}

      {deactivating && (
        <ConfirmDialog
          open={!!deactivating}
          onOpenChange={(open) => !open && setDeactivating(null)}
          title="Desactivar financiador"
          description={`${deactivating.nombre} dejará de estar disponible para nuevos financiamientos.`}
          confirmLabel="Desactivar"
          variant="destructive"
          onConfirm={handleDeactivate}
        />
      )}
    </div>
  );
}
