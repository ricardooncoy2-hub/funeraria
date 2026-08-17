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
import { ApiError } from "@/lib/api/client";
import { type User, deactivateUser, fetchUser, fetchUsers } from "@/lib/api/users";
import { toast } from "@/lib/toast/toast-store";
import { UserAccessModal } from "./user-access-modal";
import { UserFormModal } from "./user-form-modal";

const columnHelper = createTableColumns<User>();

export function UsersTab() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [accessUserId, setAccessUserId] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState<User | null>(null);

  const query = useQuery({
    queryKey: ["usuarios", { q, page }],
    queryFn: () => fetchUsers({ q: q || undefined, page }),
  });

  const accessUserQuery = useQuery({
    queryKey: ["usuarios", accessUserId],
    queryFn: () => fetchUser(accessUserId!),
    enabled: !!accessUserId,
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    try {
      await deactivateUser(deactivating.id);
      toast.success(`${deactivating.nombres} fue desactivado.`);
      refetch();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo desactivar el usuario.");
      throw error;
    }
  }

  const columns = [
    columnHelper.accessor((row) => `${row.nombres} ${row.apellidos}`, {
      id: "nombre",
      header: "Nombre",
      cell: (info) => <span className="font-medium text-neutral-950">{info.getValue()}</span>,
    }),
    columnHelper.accessor("usuario", { header: "Usuario" }),
    columnHelper.accessor("correo", { header: "Correo" }),
    columnHelper.accessor("esCorporativo", {
      header: "Alcance",
      cell: (info) => (info.getValue() ? <Badge variant="info">Corporativo</Badge> : <span className="text-neutral-500">Por sede</span>),
    }),
    columnHelper.accessor("isActive", {
      header: "Estado",
      cell: (info) => <Badge variant={info.getValue() ? "success" : "neutral"}>{info.getValue() ? "Activo" : "Inactivo"}</Badge>,
    }),
    columnHelper.display({
      id: "acciones",
      header: "Acciones",
      cell: (info) => {
        const user = info.row.original;
        return (
          <div className="flex flex-wrap justify-end gap-1">
            <Button variant="edit" size="sm" onClick={() => { setEditingUser(user); setFormOpen(true); }}>
              Editar
            </Button>
            <Button variant="edit" size="sm" onClick={() => setAccessUserId(user.id)}>
              Roles y sedes
            </Button>
            {user.isActive && (
              <Button variant="danger" size="sm" onClick={() => setDeactivating(user)}>
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
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar por nombre o correo…" />
        <Button onClick={() => { setEditingUser(undefined); setFormOpen(true); }}>
          <Plus className="size-4" aria-hidden />
          Nuevo usuario
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle={q ? "No se encontraron usuarios" : "Aún no hay usuarios registrados"}
        emptyDescription={q ? "Probá con otro término de búsqueda." : undefined}
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}

      {formOpen && (
        <UserFormModal open={formOpen} onOpenChange={setFormOpen} user={editingUser} onSuccess={refetch} />
      )}

      {accessUserId && accessUserQuery.data && (
        <UserAccessModal
          key={accessUserQuery.data.id}
          open={!!accessUserId}
          onOpenChange={(open) => !open && setAccessUserId(null)}
          user={accessUserQuery.data}
          onSuccess={refetch}
        />
      )}

      {deactivating && (
        <ConfirmDialog
          open={!!deactivating}
          onOpenChange={(open) => !open && setDeactivating(null)}
          title="Desactivar usuario"
          description={`${deactivating.nombres} ${deactivating.apellidos} no podrá iniciar sesión hasta que vuelva a activarse.`}
          confirmLabel="Desactivar"
          variant="destructive"
          onConfirm={handleDeactivate}
        />
      )}
    </div>
  );
}
