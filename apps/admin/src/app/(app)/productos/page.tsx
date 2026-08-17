"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderCog, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createTableColumns, DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { CategoryManagerModal } from "@/components/productos/category-manager-modal";
import { ProductFormModal } from "@/components/productos/product-form-modal";
import { ApiError } from "@/lib/api/client";
import { type Product, deactivateProduct, fetchProducts } from "@/lib/api/products";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";
import { toast } from "@/lib/toast/toast-store";

const columnHelper = createTableColumns<Product>();

export default function ProductosPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, "catalogo.gestionar");
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [deactivating, setDeactivating] = useState<Product | null>(null);

  const query = useQuery({
    queryKey: ["productos", { q, page }],
    queryFn: () => fetchProducts({ q: q || undefined, page }),
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["productos"] });
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    try {
      await deactivateProduct(deactivating.id);
      toast.success(`${deactivating.nombre} fue desactivado.`);
      refetch();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo desactivar el producto.");
      throw error;
    }
  }

  const columns = [
    columnHelper.accessor("codigo", { header: "Código" }),
    columnHelper.accessor("nombre", {
      header: "Nombre",
      cell: (info) => <span className="font-medium text-neutral-950">{info.getValue()}</span>,
    }),
    columnHelper.accessor("unidadMedida", { header: "Unidad" }),
    columnHelper.accessor("precioVenta", {
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
              const product = info.row.original;
              return (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(product); setFormOpen(true); }}>
                    Editar
                  </Button>
                  {product.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-600 hover:bg-danger-50"
                      onClick={() => setDeactivating(product)}
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
          <h1 className="text-3xl font-semibold text-neutral-950">Productos</h1>
          <p className="mt-1 text-sm text-neutral-700">Catálogo maestro de productos (RF-030).</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCategoriesOpen(true)}>
              <FolderCog className="size-4" aria-hidden />
              Categorías
            </Button>
            <Button onClick={() => { setEditingProduct(undefined); setFormOpen(true); }}>
              <Plus className="size-4" aria-hidden />
              Nuevo producto
            </Button>
          </div>
        )}
      </div>

      <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar por nombre o código…" />

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle={q ? "No se encontraron productos" : "Aún no hay productos registrados"}
        emptyDescription={q ? "Probá con otro término de búsqueda." : undefined}
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}

      {formOpen && (
        <ProductFormModal open={formOpen} onOpenChange={setFormOpen} product={editingProduct} onSuccess={refetch} />
      )}

      {categoriesOpen && <CategoryManagerModal open={categoriesOpen} onOpenChange={setCategoriesOpen} />}

      {deactivating && (
        <ConfirmDialog
          open={!!deactivating}
          onOpenChange={(open) => !open && setDeactivating(null)}
          title="Desactivar producto"
          description={`${deactivating.nombre} dejará de estar disponible para nuevas ventas.`}
          confirmLabel="Desactivar"
          variant="destructive"
          onConfirm={handleDeactivate}
        />
      )}
    </div>
  );
}
