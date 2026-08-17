"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { EstadoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageSpinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/client";
import { anularPurchase, fetchPurchase, recepcionarPurchase } from "@/lib/api/purchases";
import { toast } from "@/lib/toast/toast-store";

export default function CompraDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<"recepcionar" | "anular" | null>(null);

  const query = useQuery({ queryKey: ["compras", id], queryFn: () => fetchPurchase(id) });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["compras", id] });
    queryClient.invalidateQueries({ queryKey: ["compras"] });
    queryClient.invalidateQueries({ queryKey: ["inventarios"] });
  }

  async function handleConfirm() {
    try {
      if (confirming === "recepcionar") {
        await recepcionarPurchase(id);
        toast.success("Compra recepcionada: se actualizó el inventario.");
      } else if (confirming === "anular") {
        await anularPurchase(id);
        toast.success("Compra anulada.");
      }
      refetch();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo completar la acción.");
      throw error;
    }
  }

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

  const purchase = query.data;
  const isBorrador = purchase.estado === "BORRADOR";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/compras")}
            className="mb-1 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-950"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Compras
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-neutral-950">
              Compra {purchase.numeroDocumento ?? `#${purchase.id}`}
            </h1>
            <EstadoBadge estado={purchase.estado} />
          </div>
        </div>
        {isBorrador && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push(`/compras/${id}/editar`)}>
              Editar
            </Button>
            <Button variant="destructive" onClick={() => setConfirming("anular")}>
              Anular
            </Button>
            <Button onClick={() => setConfirming("recepcionar")}>Recepcionar</Button>
          </div>
        )}
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-neutral-500">Proveedor</p>
            <p className="font-medium text-neutral-950">{purchase.proveedor.razonSocial}</p>
          </div>
          <div>
            <p className="text-neutral-500">Sede</p>
            <p className="font-medium text-neutral-950">{purchase.branch.nombre}</p>
          </div>
          <div>
            <p className="text-neutral-500">Fecha</p>
            <p className="font-medium text-neutral-950">{new Date(purchase.fecha).toLocaleDateString("es-PE")}</p>
          </div>
        </div>
        {purchase.observaciones && (
          <p className="mt-4 text-sm text-neutral-700">
            <span className="text-neutral-500">Observaciones: </span>
            {purchase.observaciones}
          </p>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-neutral-950">Ítems</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-neutral-700">Producto</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-700">Cantidad</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-700">Costo unit.</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-700">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2 text-neutral-950">{item.producto.nombre}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.cantidad}</td>
                  <td className="px-3 py-2 text-right tabular-nums">S/ {Number(item.costoUnitario).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">S/ {Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col items-end gap-1 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex w-56 justify-between text-neutral-700">
            <span>Subtotal</span>
            <span className="tabular-nums">S/ {Number(purchase.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex w-56 justify-between text-neutral-700">
            <span>IGV</span>
            <span className="tabular-nums">S/ {Number(purchase.igv).toFixed(2)}</span>
          </div>
          <div className="flex w-56 justify-between text-base font-semibold text-neutral-950">
            <span>Total</span>
            <span className="tabular-nums">S/ {Number(purchase.total).toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {confirming && (
        <ConfirmDialog
          open={!!confirming}
          onOpenChange={(open) => !open && setConfirming(null)}
          title={confirming === "recepcionar" ? "Recepcionar compra" : "Anular compra"}
          description={
            confirming === "recepcionar"
              ? "Se actualizará el inventario de la sede y el costo promedio de cada producto. Esta acción no se puede deshacer."
              : "La compra pasará a estado ANULADA y no podrá recepcionarse."
          }
          confirmLabel={confirming === "recepcionar" ? "Recepcionar" : "Anular"}
          variant={confirming === "recepcionar" ? "primary" : "destructive"}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
