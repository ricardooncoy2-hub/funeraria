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
import { PlanFormModal } from "@/components/planes/plan-form-modal";
import { ApiError } from "@/lib/api/client";
import { type Plan, deactivatePlan, fetchPlan, fetchPlans } from "@/lib/api/plans";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";
import { toast } from "@/lib/toast/toast-store";

const columnHelper = createTableColumns<Plan>();

export default function PlanesPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, "catalogo.gestionar");
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<Plan | null>(null);

  const query = useQuery({
    queryKey: ["planes", { q, page }],
    queryFn: () => fetchPlans({ q: q || undefined, page }),
  });

  const editingPlanQuery = useQuery({
    queryKey: ["planes", editingPlanId],
    queryFn: () => fetchPlan(editingPlanId!),
    enabled: !!editingPlanId,
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["planes"] });
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    try {
      await deactivatePlan(deactivating.id);
      toast.success(`${deactivating.nombre} fue desactivado.`);
      refetch();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo desactivar el plan.");
      throw error;
    }
  }

  const columns = [
    columnHelper.accessor("codigo", { header: "Código" }),
    columnHelper.accessor("nombre", {
      header: "Nombre",
      cell: (info) => <span className="font-medium text-neutral-950">{info.getValue()}</span>,
    }),
    columnHelper.accessor("precio", {
      header: "Precio",
      cell: (info) => <span className="tabular-nums">S/ {Number(info.getValue()).toFixed(2)}</span>,
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
              const plan = info.row.original;
              return (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingPlanId(plan.id)}>
                    Editar
                  </Button>
                  {plan.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-600 hover:bg-danger-50"
                      onClick={() => setDeactivating(plan)}
                    >
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
          <h1 className="text-3xl font-semibold text-neutral-950">Planes</h1>
          <p className="mt-1 text-sm text-neutral-700">Planes/paquetes de productos y servicios (RF-033).</p>
        </div>
        {canManage && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden />
            Nuevo plan
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
        emptyTitle={q ? "No se encontraron planes" : "Aún no hay planes registrados"}
        emptyDescription={q ? "Probá con otro término de búsqueda." : undefined}
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}

      {creating && (
        <PlanFormModal open={creating} onOpenChange={setCreating} onSuccess={refetch} />
      )}

      {editingPlanId && editingPlanQuery.data && (
        <PlanFormModal
          key={editingPlanQuery.data.id}
          open={!!editingPlanId}
          onOpenChange={(open) => !open && setEditingPlanId(null)}
          plan={editingPlanQuery.data}
          onSuccess={refetch}
        />
      )}

      {deactivating && (
        <ConfirmDialog
          open={!!deactivating}
          onOpenChange={(open) => !open && setDeactivating(null)}
          title="Desactivar plan"
          description={`${deactivating.nombre} dejará de estar disponible para nuevas ventas.`}
          confirmLabel="Desactivar"
          variant="destructive"
          onConfirm={handleDeactivate}
        />
      )}
    </div>
  );
}
