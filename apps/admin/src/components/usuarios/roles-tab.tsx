"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPermissions, fetchRole, fetchRoles } from "@/lib/api/roles";

/** Solo lectura: gestionar roles/permisos requiere `roles.gestionar` (corporativo
 * exclusivo) y no es una tarea frecuente — se deja para una fase posterior. */
export function RolesTab() {
  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: fetchRoles });
  const permissionsQuery = useQuery({ queryKey: ["permisos"], queryFn: fetchPermissions });
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);

  const roleDetailQuery = useQuery({
    queryKey: ["roles", openRoleId],
    queryFn: () => fetchRole(openRoleId!),
    enabled: !!openRoleId,
  });

  const permisosByModulo = new Map<string, { codigo: string; nombre: string }[]>();
  for (const p of permissionsQuery.data ?? []) {
    if (!permisosByModulo.has(p.modulo)) permisosByModulo.set(p.modulo, []);
    permisosByModulo.get(p.modulo)!.push(p);
  }

  if (rolesQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!rolesQuery.data || rolesQuery.data.length === 0) {
    return <EmptyState title="Aún no hay roles registrados" />;
  }

  const openRole = roleDetailQuery.data;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rolesQuery.data.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setOpenRoleId(role.id)}
            className="text-left"
          >
            <Card className="cursor-pointer transition-colors hover:border-brand-300">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-neutral-950">{role.nombre}</p>
                <Badge variant={role.isActive ? "success" : "neutral"}>
                  {role.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              {role.descripcion && <p className="mt-1 text-sm text-neutral-700">{role.descripcion}</p>}
            </Card>
          </button>
        ))}
      </div>

      <Modal
        open={!!openRoleId}
        onOpenChange={(open) => !open && setOpenRoleId(null)}
        title={openRole ? `Permisos de ${openRole.nombre}` : "Permisos"}
        size="md"
      >
        {!openRole ? (
          <Skeleton className="h-40" />
        ) : (
          <div className="flex max-h-96 flex-col gap-4 overflow-y-auto">
            {[...permisosByModulo.entries()].map(([modulo, permisos]) => (
              <div key={modulo}>
                <p className="mb-1.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase">{modulo}</p>
                <div className="flex flex-col gap-1">
                  {permisos.map((p) => (
                    <div key={p.codigo} className="flex items-center gap-2 text-sm">
                      <Badge variant={openRole.permisos.includes(p.codigo) ? "success" : "neutral"} className="w-16 justify-center">
                        {openRole.permisos.includes(p.codigo) ? "Sí" : "No"}
                      </Badge>
                      {p.nombre}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
