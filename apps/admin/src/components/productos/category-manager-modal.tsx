"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { createCategory, fetchCategories } from "@/lib/api/products";
import { toast } from "@/lib/toast/toast-store";

export function CategoryManagerModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["categorias-producto"], queryFn: fetchCategories, enabled: open });
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!nombre.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createCategory({ nombre: nombre.trim() });
      setNombre("");
      queryClient.invalidateQueries({ queryKey: ["categorias-producto"] });
      toast.success(`Categoría "${nombre.trim()}" creada.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la categoría.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Categorías de producto" size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de la nueva categoría"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          />
          <Button onClick={handleAdd} loading={saving} disabled={!nombre.trim()}>
            Agregar
          </Button>
        </div>

        {error && <Banner variant="danger">{error}</Banner>}

        {query.isLoading ? (
          <Skeleton className="h-24" />
        ) : !query.data || query.data.length === 0 ? (
          <EmptyState title="Aún no hay categorías" />
        ) : (
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {query.data.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-neutral-50">
                <span className="text-sm text-neutral-950">{c.nombre}</span>
                <Badge variant={c.isActive ? "success" : "neutral"}>{c.isActive ? "Activa" : "Inactiva"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
