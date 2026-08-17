"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { PageSpinner } from "@/components/ui/spinner";
import { fetchAllBranches } from "@/lib/api/branches";
import { ApiError } from "@/lib/api/client";
import { fetchRoles } from "@/lib/api/roles";
import { type UserDetail, setUserRoles, setUserSedes } from "@/lib/api/users";
import { toast } from "@/lib/toast/toast-store";

/** RF-006 — asigna roles y sedes. Son dos endpoints separados en el backend;
 * se guardan en secuencia para que el modal se sienta como una sola acción. */
export function UserAccessModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserDetail;
  onSuccess: () => void;
}) {
  const rolesQuery = useQuery({ queryKey: ["roles"], queryFn: fetchRoles, enabled: open });
  const branchesQuery = useQuery({ queryKey: ["sedes", "all"], queryFn: fetchAllBranches, enabled: open });

  // Sin useEffect: el padre monta este modal con `key={user.id}` (ver UsersTab),
  // así que un usuario distinto siempre es una instancia nueva del componente.
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() =>
    user.userRoles.map((ur) => ur.role.codigo),
  );
  const [selectedSedes, setSelectedSedes] = useState<string[]>(() =>
    user.userBranches.map((ub) => ub.sedeId),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRole(codigo: string) {
    setSelectedRoles((prev) => (prev.includes(codigo) ? prev.filter((r) => r !== codigo) : [...prev, codigo]));
  }

  function toggleSede(id: string) {
    setSelectedSedes((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await setUserRoles(user.id, selectedRoles);
      if (!user.esCorporativo) {
        await setUserSedes(user.id, selectedSedes);
      }
      toast.success(`Accesos de ${user.nombres} actualizados.`);
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar los accesos.");
    } finally {
      setSaving(false);
    }
  }

  const loading = rolesQuery.isLoading || branchesQuery.isLoading;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Roles y sedes — ${user.nombres} ${user.apellidos}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={loading}>
            Guardar
          </Button>
        </>
      }
    >
      {loading ? (
        <PageSpinner />
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-950">Roles</p>
            <div className="flex flex-col gap-2">
              {(rolesQuery.data ?? []).map((role) => (
                <label key={role.id} className="flex items-center gap-2.5 text-sm text-neutral-950">
                  <Checkbox checked={selectedRoles.includes(role.codigo)} onCheckedChange={() => toggleRole(role.codigo)} />
                  {role.nombre}
                </label>
              ))}
            </div>
          </div>

          {user.esCorporativo ? (
            <Banner variant="info">Este usuario tiene acceso corporativo: opera sobre todas las sedes.</Banner>
          ) : (
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-950">Sedes</p>
              <div className="flex flex-col gap-2">
                {(branchesQuery.data ?? []).map((sede) => (
                  <label key={sede.id} className="flex items-center gap-2.5 text-sm text-neutral-950">
                    <Checkbox checked={selectedSedes.includes(sede.id)} onCheckedChange={() => toggleSede(sede.id)} />
                    {sede.nombre}
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <Banner variant="danger">{error}</Banner>}
        </div>
      )}
    </Modal>
  );
}
