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
import { SupplierFormModal } from "@/components/proveedores/supplier-form-modal";
import { ApiError } from "@/lib/api/client";
import { type Supplier, deactivateSupplier, fetchSuppliers } from "@/lib/api/suppliers";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";
import { toast } from "@/lib/toast/toast-store";

const columnHelper = createTableColumns<Supplier>();

export default function ProveedoresPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, "compras.gestionar");
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | undefined>(undefined);
  const [deactivating, setDeactivating] = useState<Supplier | null>(null);

  const query = useQuery({
    queryKey: ["proveedores", { q, page }],
    queryFn: () => fetchSuppliers({ q: q || undefined, page }),
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["proveedores"] });
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    try {
      await deactivateSupplier(deactivating.id);
      toast.success(`${deactivating.razonSocial} fue desactivado.`);
      refetch();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo desactivar el proveedor.");
      throw error;
    }
  }

  const columns = [
    columnHelper.accessor("razonSocial", {
      header: "Razón social",
      cell: (info) => <span className="font-medium text-neutral-950">{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => `${row.tipoDocumento} ${row.numeroDocumento}`, {
      id: "documento",
      header: "Documento",
    }),
    columnHelper.accessor("telefono", {
      header: "Teléfono",
      cell: (info) => info.getValue() || <span className="text-neutral-400">—</span>,
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
              const supplier = info.row.original;
              return (
                <div className="flex justify-end gap-1">
                  <Button variant="edit" size="sm" onClick={() => { setEditing(supplier); setFormOpen(true); }}>
                    Editar
                  </Button>
                  {supplier.isActive && (
                    <Button variant="danger" size="sm" onClick={() => setDeactivating(supplier)}>
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
          <h1 className="text-3xl font-semibold text-neutral-950">Proveedores</h1>
          <p className="mt-1 text-sm text-neutral-700">Proveedores para compras (RF-035).</p>
        </div>
        {canManage && (
          <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
            <Plus className="size-4" aria-hidden />
            Nuevo proveedor
          </Button>
        )}
      </div>

      <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar por razón social…" />

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle={q ? "No se encontraron proveedores" : "Aún no hay proveedores registrados"}
        emptyDescription={q ? "Probá con otro término de búsqueda." : undefined}
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}

      {formOpen && (
        <SupplierFormModal open={formOpen} onOpenChange={setFormOpen} supplier={editing} onSuccess={refetch} />
      )}

      {deactivating && (
        <ConfirmDialog
          open={!!deactivating}
          onOpenChange={(open) => !open && setDeactivating(null)}
          title="Desactivar proveedor"
          description={`${deactivating.razonSocial} dejará de estar disponible para nuevas compras.`}
          confirmLabel="Desactivar"
          variant="destructive"
          onConfirm={handleDeactivate}
        />
      )}
    </div>
  );
}
