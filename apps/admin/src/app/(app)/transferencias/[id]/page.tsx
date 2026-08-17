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
import {
  aprobarTransfer,
  cancelarTransfer,
  enviarTransfer,
  fetchTransfer,
  recibirTransfer,
} from "@/lib/api/transfers";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";
import { toast } from "@/lib/toast/toast-store";

type Action = "aprobar" | "enviar" | "recibir" | "cancelar";

const ACTION_LABEL: Record<Action, string> = {
  aprobar: "Aprobar",
  enviar: "Enviar",
  recibir: "Recibir",
  cancelar: "Cancelar",
};

const ACTION_PAST_LABEL: Record<Action, string> = {
  aprobar: "aprobada",
  enviar: "enviada",
  recibir: "recibida",
  cancelar: "cancelada",
};

const ACTION_DESCRIPTION: Record<Action, string> = {
  aprobar: "La transferencia quedará lista para enviarse. Aún no afecta el inventario.",
  enviar: "Se descontará el stock de la sede origen (RB-025). Esta acción no se puede deshacer.",
  recibir: "Se sumará el stock a la sede destino con el costo transferido desde origen.",
  cancelar: "La transferencia pasará a estado CANCELADA. Solo es posible antes de enviarla.",
};

export default function TransferenciaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [confirming, setConfirming] = useState<Action | null>(null);

  const query = useQuery({ queryKey: ["transferencias", id], queryFn: () => fetchTransfer(id) });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["transferencias", id] });
    queryClient.invalidateQueries({ queryKey: ["transferencias"] });
    queryClient.invalidateQueries({ queryKey: ["inventarios"] });
  }

  const ACTION_FN: Record<Action, (id: string) => Promise<unknown>> = {
    aprobar: aprobarTransfer,
    enviar: enviarTransfer,
    recibir: recibirTransfer,
    cancelar: cancelarTransfer,
  };

  async function handleConfirm() {
    if (!confirming) return;
    try {
      await ACTION_FN[confirming](id);
      toast.success(`Transferencia ${ACTION_PAST_LABEL[confirming]} correctamente.`);
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
          {query.error instanceof ApiError ? query.error.message : "No se pudo cargar la transferencia."}
        </p>
      </Card>
    );
  }

  const transfer = query.data;
  const canSolicitar = hasPermission(user, "transferencias.solicitar");
  const canAprobar = hasPermission(user, "transferencias.aprobar");
  const canRecibir = hasPermission(user, "transferencias.recibir");

  const availableActions: Action[] = [];
  if (transfer.estado === "SOLICITADA") {
    if (canAprobar) availableActions.push("aprobar");
    if (canSolicitar) availableActions.push("cancelar");
  } else if (transfer.estado === "APROBADA") {
    if (canSolicitar) availableActions.push("enviar", "cancelar");
  } else if (transfer.estado === "ENVIADA") {
    if (canRecibir) availableActions.push("recibir");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/transferencias")}
            className="mb-1 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-950"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Transferencias
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-neutral-950">{transfer.codigo}</h1>
            <EstadoBadge estado={transfer.estado} />
          </div>
        </div>
        {availableActions.length > 0 && (
          <div className="flex gap-2">
            {availableActions.map((action) => (
              <Button
                key={action}
                variant={action === "cancelar" ? "destructive" : "primary"}
                onClick={() => setConfirming(action)}
              >
                {ACTION_LABEL[action]}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-neutral-500">Sede origen</p>
            <p className="font-medium text-neutral-950">{transfer.sedeOrigen.nombre}</p>
          </div>
          <div>
            <p className="text-neutral-500">Sede destino</p>
            <p className="font-medium text-neutral-950">{transfer.sedeDestino.nombre}</p>
          </div>
        </div>
        {transfer.motivo && (
          <p className="mt-4 text-sm text-neutral-700">
            <span className="text-neutral-500">Motivo: </span>
            {transfer.motivo}
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
              </tr>
            </thead>
            <tbody>
              {transfer.items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2 text-neutral-950">{item.producto.nombre}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {confirming && (
        <ConfirmDialog
          open={!!confirming}
          onOpenChange={(open) => !open && setConfirming(null)}
          title={`${ACTION_LABEL[confirming]} transferencia`}
          description={ACTION_DESCRIPTION[confirming]}
          confirmLabel={ACTION_LABEL[confirming]}
          variant={confirming === "cancelar" ? "destructive" : "primary"}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
