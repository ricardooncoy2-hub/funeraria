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
import { CustomerFormModal } from "@/components/clientes/customer-form-modal";
import { ApiError } from "@/lib/api/client";
import { type Customer, deactivateCustomer, fetchCustomers } from "@/lib/api/customers";
import { toast } from "@/lib/toast/toast-store";

const columnHelper = createTableColumns<Customer>();

export default function ClientesPage() {
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>(undefined);
  const [deactivating, setDeactivating] = useState<Customer | null>(null);

  const query = useQuery({
    queryKey: ["clientes", { q, page }],
    queryFn: () => fetchCustomers({ q: q || undefined, page }),
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["clientes"] });
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    try {
      await deactivateCustomer(deactivating.id);
      toast.success(`${deactivating.nombres} fue desactivado.`);
      refetch();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo desactivar el cliente.");
      throw error;
    }
  }

  const columns = [
    columnHelper.accessor((row) => [row.nombres, row.apellidos].filter(Boolean).join(" "), {
      id: "nombre",
      header: "Nombre / Razón social",
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
    columnHelper.display({
      id: "acciones",
      header: "Acciones",
      cell: (info) => {
        const customer = info.row.original;
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(customer); setFormOpen(true); }}>
              Editar
            </Button>
            {customer.isActive && (
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-600 hover:bg-danger-50"
                onClick={() => setDeactivating(customer)}
              >
                Desactivar
              </Button>
            )}
          </div>
        );
      },
    }),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-950">Clientes</h1>
          <p className="mt-1 text-sm text-neutral-700">Clientes de la empresa (RF-070/071).</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus className="size-4" aria-hidden />
          Nuevo cliente
        </Button>
      </div>

      <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar por nombre o documento…" />

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle={q ? "No se encontraron clientes" : "Aún no hay clientes registrados"}
        emptyDescription={q ? "Probá con otro término de búsqueda." : undefined}
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}

      {formOpen && (
        <CustomerFormModal open={formOpen} onOpenChange={setFormOpen} customer={editing} onSuccess={refetch} />
      )}

      {deactivating && (
        <ConfirmDialog
          open={!!deactivating}
          onOpenChange={(open) => !open && setDeactivating(null)}
          title="Desactivar cliente"
          description={`${deactivating.nombres} quedará inactivo. Podrá reactivarlo editándolo más adelante.`}
          confirmLabel="Desactivar"
          variant="destructive"
          onConfirm={handleDeactivate}
        />
      )}
    </div>
  );
}
