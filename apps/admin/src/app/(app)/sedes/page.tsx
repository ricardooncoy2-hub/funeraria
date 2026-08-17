"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Star } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createTableColumns, DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { SedeFormModal } from "@/components/sedes/sede-form-modal";
import { ApiError } from "@/lib/api/client";
import { type Branch, deactivateBranch, fetchBranches, setPrincipalBranch } from "@/lib/api/branches";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";
import { toast } from "@/lib/toast/toast-store";

const columnHelper = createTableColumns<Branch>();

export default function SedesPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, "sedes.gestionar");
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<Branch | undefined>(undefined);
  const [confirmAction, setConfirmAction] = useState<
    { type: "principal" | "desactivar"; sede: Branch } | null
  >(null);

  const query = useQuery({
    queryKey: ["sedes", { q, page }],
    queryFn: () => fetchBranches({ q: q || undefined, page }),
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["sedes"] });
  }

  function openCreate() {
    setEditingSede(undefined);
    setFormOpen(true);
  }

  function openEdit(sede: Branch) {
    setEditingSede(sede);
    setFormOpen(true);
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === "principal") {
        await setPrincipalBranch(confirmAction.sede.id);
        toast.success(`${confirmAction.sede.nombre} ahora es la sede principal.`);
      } else {
        await deactivateBranch(confirmAction.sede.id);
        toast.success(`${confirmAction.sede.nombre} fue desactivada.`);
      }
      refetch();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo completar la acción.");
      throw error;
    }
  }

  const columns = [
    columnHelper.accessor("codigo", { header: "Código" }),
    columnHelper.accessor("nombre", {
      header: "Nombre",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-950">{info.getValue()}</span>
          {info.row.original.isMain && (
            <Star className="size-3.5 fill-warning-600 text-warning-600" aria-label="Sede principal" />
          )}
        </div>
      ),
    }),
    columnHelper.accessor((row) => [row.departamento, row.provincia].filter(Boolean).join(" / "), {
      id: "ubicacion",
      header: "Ubicación",
      cell: (info) => info.getValue() || <span className="text-neutral-400">—</span>,
    }),
    columnHelper.accessor("isActive", {
      header: "Estado",
      cell: (info) => <Badge variant={info.getValue() ? "success" : "neutral"}>{info.getValue() ? "Activa" : "Inactiva"}</Badge>,
    }),
    ...(canManage
      ? [
          columnHelper.display({
            id: "acciones",
            header: "Acciones",
            cell: (info) => {
              const sede = info.row.original;
              return (
                <div className="flex flex-wrap justify-end gap-1">
                  <Button variant="edit" size="sm" onClick={() => openEdit(sede)}>
                    Editar
                  </Button>
                  {!sede.isMain && sede.isActive && (
                    <Button variant="edit" size="sm" onClick={() => setConfirmAction({ type: "principal", sede })}>
                      Marcar principal
                    </Button>
                  )}
                  {!sede.isMain && sede.isActive && (
                    <Button variant="danger" size="sm" onClick={() => setConfirmAction({ type: "desactivar", sede })}>
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
        <div>
          <h1 className="text-3xl font-semibold text-neutral-950">Sedes</h1>
          <p className="mt-1 text-sm text-neutral-700">Sedes de la empresa y su sede principal.</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            Nueva sede
          </Button>
        )}
      </div>

      <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar por nombre o código…" />

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle={q ? "No se encontraron sedes" : "Aún no hay sedes registradas"}
        emptyDescription={q ? "Probá con otro término de búsqueda." : undefined}
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}

      {formOpen && (
        <SedeFormModal open={formOpen} onOpenChange={setFormOpen} sede={editingSede} onSuccess={refetch} />
      )}

      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={confirmAction.type === "principal" ? "Marcar como sede principal" : "Desactivar sede"}
          description={
            confirmAction.type === "principal"
              ? `${confirmAction.sede.nombre} pasará a ser la sede principal. La sede principal actual dejará de serlo.`
              : `${confirmAction.sede.nombre} quedará inactiva. Podrá reactivarla editándola más adelante.`
          }
          confirmLabel={confirmAction.type === "principal" ? "Marcar principal" : "Desactivar"}
          variant={confirmAction.type === "desactivar" ? "destructive" : "primary"}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
