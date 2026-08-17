"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { PurchaseForm } from "@/components/compras/purchase-form";
import { ApiError } from "@/lib/api/client";
import { fetchPurchase } from "@/lib/api/purchases";

export default function EditarCompraPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: ["compras", id], queryFn: () => fetchPurchase(id) });

  if (query.isLoading) return <PageSpinner />;
  if (query.isError || !query.data) {
    return (
      <Card>
        <p className="text-sm text-danger-600">
          {query.error instanceof ApiError ? query.error.message : "No se pudo cargar la compra."}
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-950">Editar compra</h1>
        <p className="mt-1 text-sm text-neutral-700">Solo disponible mientras la compra esté en BORRADOR.</p>
      </div>
      <PurchaseForm purchase={query.data} />
    </div>
  );
}
