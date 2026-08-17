"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchKardex } from "@/lib/api/inventory";

const TIPO_LABEL: Record<string, string> = {
  COMPRA: "Compra",
  TRANSFERENCIA_ENTRADA: "Transferencia (entrada)",
  TRANSFERENCIA_SALIDA: "Transferencia (salida)",
  VENTA: "Venta",
  DEVOLUCION: "Devolución",
  AJUSTE_ENTRADA: "Ajuste (entrada)",
  AJUSTE_SALIDA: "Ajuste (salida)",
  MERMA: "Merma",
  ANULACION_VENTA: "Anulación de venta",
};

const ENTRY_TYPES = new Set(["COMPRA", "TRANSFERENCIA_ENTRADA", "DEVOLUCION", "AJUSTE_ENTRADA", "ANULACION_VENTA"]);

export function KardexModal({
  open,
  onOpenChange,
  sedeId,
  productoId,
  productoNombre,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sedeId: string;
  productoId: string;
  productoNombre: string;
}) {
  const query = useQuery({
    queryKey: ["kardex", sedeId, productoId],
    queryFn: () => fetchKardex({ sedeId, productoId }),
    enabled: open,
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Kardex — ${productoNombre}`} size="md">
      {query.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : !query.data || query.data.length === 0 ? (
        <EmptyState title="Sin movimientos" description="Este producto no tiene movimientos registrados en esta sede." />
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-neutral-100">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-neutral-700">Fecha</th>
                <th className="px-2 py-2 text-left font-medium text-neutral-700">Tipo</th>
                <th className="px-2 py-2 text-right font-medium text-neutral-700">Cantidad</th>
                <th className="px-2 py-2 text-right font-medium text-neutral-700">Stock resultante</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((m) => {
                const isEntry = ENTRY_TYPES.has(m.tipo);
                return (
                  <tr key={m.id} className="border-t border-neutral-200">
                    <td className="px-2 py-2 whitespace-nowrap text-neutral-700">
                      {new Date(m.createdAt).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant={isEntry ? "success" : "danger"}>{TIPO_LABEL[m.tipo] ?? m.tipo}</Badge>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {isEntry ? "+" : "-"}
                      {m.cantidad}
                    </td>
                    <td className="px-2 py-2 text-right font-medium tabular-nums text-neutral-950">{m.stockPosterior}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
