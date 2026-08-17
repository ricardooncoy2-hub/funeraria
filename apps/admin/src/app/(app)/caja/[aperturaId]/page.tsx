"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { CloseCashModal } from "@/components/caja/close-cash-modal";
import { RegisterMovementModal } from "@/components/caja/register-movement-modal";
import { ApiError } from "@/lib/api/client";
import { fetchCajas, fetchResumen } from "@/lib/api/cash";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";

const TIPO_LABELS: Record<string, string> = {
  INGRESO: "Ingresos manuales",
  EGRESO: "Egresos manuales",
  RETIRO: "Retiros",
  VENTA_EFECTIVO: "Ventas en efectivo",
};

export default function AperturaCajaPage() {
  const { aperturaId } = useParams<{ aperturaId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canOperar = hasPermission(user, "caja.operar");
  const canCerrar = hasPermission(user, "caja.cerrar");

  const [movementOpen, setMovementOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const cajasQuery = useQuery({ queryKey: ["cajas"], queryFn: () => fetchCajas() });
  const resumenQuery = useQuery({
    queryKey: ["caja-resumen", aperturaId],
    queryFn: () => fetchResumen(aperturaId),
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["caja-resumen", aperturaId] });
    queryClient.invalidateQueries({ queryKey: ["cajas"] });
  }

  if (resumenQuery.isLoading) return <PageSpinner />;
  if (resumenQuery.isError || !resumenQuery.data) {
    return (
      <Card>
        <p className="text-sm text-danger-600">
          {resumenQuery.error instanceof ApiError ? resumenQuery.error.message : "No se pudo cargar la apertura de caja."}
        </p>
      </Card>
    );
  }

  const { apertura, totales, saldoTeorico } = resumenQuery.data;
  const caja = (cajasQuery.data?.data ?? []).find((c) => c.id === apertura.cajaId);
  const abierta = apertura.estado === "ABIERTA";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/caja")}
            className="mb-1 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-950"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Caja
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-neutral-950">{caja?.nombre ?? "Caja"}</h1>
            <Badge variant={abierta ? "success" : "neutral"}>{abierta ? "Abierta" : "Cerrada"}</Badge>
          </div>
        </div>
        {abierta && (
          <div className="flex gap-3">
            {canOperar && (
              <Button variant="secondary" onClick={() => setMovementOpen(true)}>
                Registrar movimiento
              </Button>
            )}
            {canCerrar && (
              <Button variant="destructive" onClick={() => setCloseOpen(true)}>
                Cerrar caja
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-neutral-500">Fecha apertura</p>
            <p className="font-medium text-neutral-950">{new Date(apertura.fechaApertura).toLocaleString("es-PE")}</p>
          </div>
          <div>
            <p className="text-neutral-500">Saldo inicial</p>
            <p className="font-medium text-neutral-950 tabular-nums">S/ {Number(apertura.saldoInicial).toFixed(2)}</p>
          </div>
          {apertura.fechaCierre && (
            <div>
              <p className="text-neutral-500">Fecha cierre</p>
              <p className="font-medium text-neutral-950">{new Date(apertura.fechaCierre).toLocaleString("es-PE")}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-neutral-950">Resumen de movimientos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-neutral-700">Tipo</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totales).length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-3 py-4 text-center text-neutral-500">
                    Sin movimientos registrados.
                  </td>
                </tr>
              ) : (
                Object.entries(totales).map(([tipo, monto]) => (
                  <tr key={tipo} className="border-t border-neutral-200">
                    <td className="px-3 py-2 text-neutral-950">{TIPO_LABELS[tipo] ?? tipo}</td>
                    <td className="px-3 py-2 text-right tabular-nums">S/ {Number(monto).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col items-end gap-1 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex w-64 justify-between text-base font-semibold text-neutral-950">
            <span>Saldo teórico</span>
            <span className="tabular-nums">S/ {Number(saldoTeorico).toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {!abierta && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-neutral-950">Arqueo</h2>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-neutral-500">Saldo esperado</p>
              <p className="font-medium text-neutral-950 tabular-nums">S/ {Number(apertura.saldoEsperado).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Saldo contado</p>
              <p className="font-medium text-neutral-950 tabular-nums">S/ {Number(apertura.saldoContado).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Diferencia</p>
              <p
                className={`font-semibold tabular-nums ${
                  Number(apertura.diferencia) === 0
                    ? "text-success-700"
                    : Number(apertura.diferencia) > 0
                      ? "text-warning-700"
                      : "text-danger-700"
                }`}
              >
                S/ {Number(apertura.diferencia).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {movementOpen && (
        <RegisterMovementModal
          open={movementOpen}
          onOpenChange={setMovementOpen}
          aperturaId={aperturaId}
          onSuccess={refetch}
        />
      )}

      {closeOpen && (
        <CloseCashModal
          open={closeOpen}
          onOpenChange={setCloseOpen}
          aperturaId={aperturaId}
          saldoTeorico={Number(saldoTeorico)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
