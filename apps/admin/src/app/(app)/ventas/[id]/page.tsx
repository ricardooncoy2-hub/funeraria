"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, EstadoBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageSpinner } from "@/components/ui/spinner";
import { FinancingStateControl } from "@/components/ventas/financing-state-control";
import { RegisterPaymentModal } from "@/components/ventas/register-payment-modal";
import { ApiError } from "@/lib/api/client";
import { anularPayment } from "@/lib/api/payments";
import { anularSale, fetchEstadoCuenta, fetchSale, type Financing } from "@/lib/api/sales";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";
import { toast } from "@/lib/toast/toast-store";

export default function VentaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canRegistrarPago = hasPermission(user, "pagos.registrar");
  const canAnularPago = hasPermission(user, "pagos.anular");
  const canAnularVenta = hasPermission(user, "ventas.anular");

  const [payingFinancing, setPayingFinancing] = useState<Financing | null>(null);
  const [voidingPaymentId, setVoidingPaymentId] = useState<string | null>(null);
  const [anulandoVenta, setAnulandoVenta] = useState(false);
  const [motivo, setMotivo] = useState("");

  const saleQuery = useQuery({ queryKey: ["ventas", id], queryFn: () => fetchSale(id) });
  const cuentaQuery = useQuery({ queryKey: ["ventas", id, "estado-cuenta"], queryFn: () => fetchEstadoCuenta(id) });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["ventas", id] });
    queryClient.invalidateQueries({ queryKey: ["ventas"] });
    queryClient.invalidateQueries({ queryKey: ["inventarios"] });
  }

  async function handleVoidPayment() {
    if (!voidingPaymentId) return;
    try {
      await anularPayment(voidingPaymentId, motivo);
      toast.success("Pago anulado correctamente.");
      setMotivo("");
      setVoidingPaymentId(null);
      refetch();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo anular el pago.");
      throw error;
    }
  }

  async function handleVoidSale() {
    try {
      await anularSale(id, motivo);
      toast.success("Venta anulada correctamente.");
      setMotivo("");
      setAnulandoVenta(false);
      refetch();
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo anular la venta.");
      throw error;
    }
  }

  if (saleQuery.isLoading) return <PageSpinner />;
  if (saleQuery.isError || !saleQuery.data) {
    return (
      <Card>
        <p className="text-sm text-danger-600">
          {saleQuery.error instanceof ApiError ? saleQuery.error.message : "No se pudo cargar la venta."}
        </p>
      </Card>
    );
  }

  const sale = saleQuery.data;
  const cuenta = cuentaQuery.data;
  const puedeAnular = canAnularVenta && sale.estado === "CONFIRMADA" && sale.payments.every((p) => p.estado !== "CONFIRMADO");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/ventas")}
            className="mb-1 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-950"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Ventas
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-neutral-950">{sale.codigo}</h1>
            <EstadoBadge estado={sale.estado} />
          </div>
        </div>
        {puedeAnular && (
          <Button variant="destructive" onClick={() => setAnulandoVenta(true)}>
            Anular venta
          </Button>
        )}
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-neutral-500">Cliente</p>
            <p className="font-medium text-neutral-950">
              {sale.cliente.nombres} {sale.cliente.apellidos}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">Sede</p>
            <p className="font-medium text-neutral-950">{sale.sedeVenta.nombre}</p>
          </div>
          <div>
            <p className="text-neutral-500">Vendedor</p>
            <p className="font-medium text-neutral-950">
              {sale.vendedor.nombres} {sale.vendedor.apellidos}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">Fecha</p>
            <p className="font-medium text-neutral-950">{new Date(sale.fecha).toLocaleDateString("es-PE")}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-neutral-950">Ítems</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-neutral-700">Descripción</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-700">Cantidad</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-700">Precio unit.</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-700">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2 text-neutral-950">{item.descripcion}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.cantidad}</td>
                  <td className="px-3 py-2 text-right tabular-nums">S/ {Number(item.precioUnitario).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">S/ {Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col items-end gap-1 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex w-56 justify-between text-neutral-700">
            <span>Subtotal</span>
            <span className="tabular-nums">S/ {Number(sale.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex w-56 justify-between text-neutral-700">
            <span>Descuento</span>
            <span className="tabular-nums">S/ {Number(sale.descuento).toFixed(2)}</span>
          </div>
          <div className="flex w-56 justify-between text-neutral-700">
            <span>IGV</span>
            <span className="tabular-nums">S/ {Number(sale.igv).toFixed(2)}</span>
          </div>
          <div className="flex w-56 justify-between text-base font-semibold text-neutral-950">
            <span>Total</span>
            <span className="tabular-nums">S/ {Number(sale.total).toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {cuenta && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-neutral-950">Estado de cuenta</h2>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-neutral-500">Total</p>
              <p className="text-lg font-semibold text-neutral-950 tabular-nums">S/ {Number(cuenta.total).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Financiado</p>
              <p className="text-lg font-semibold text-neutral-950 tabular-nums">S/ {Number(cuenta.financiado).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Cobrado</p>
              <p className="text-lg font-semibold text-success-700 tabular-nums">S/ {Number(cuenta.cobrado).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-neutral-500">Por cobrar</p>
              <p className="text-lg font-semibold text-warning-700 tabular-nums">S/ {Number(cuenta.porCobrar).toFixed(2)}</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-neutral-950">Financiamiento</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-neutral-700">Origen</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-700">Monto</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-700">Estado</th>
                <th className="px-3 py-2 text-right font-medium text-neutral-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sale.financings.map((f) => {
                const porFinanciador = cuenta?.porFinanciador.find((pf) => pf.financiamientoId === f.id);
                const pendiente = porFinanciador ? Number(porFinanciador.pendiente) : Number(f.monto);
                return (
                  <tr key={f.id} className="border-t border-neutral-200">
                    <td className="px-3 py-2 text-neutral-950">
                      {f.origenTipo === "CLIENTE" ? "Cliente" : (f.financiador?.nombre ?? "Institución")}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">S/ {Number(f.monto).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <FinancingStateControl id={f.id} origenTipo={f.origenTipo} estado={f.estado} onChanged={refetch} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {canRegistrarPago && pendiente > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setPayingFinancing(f)}>
                          Registrar pago
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-neutral-950">Pagos</h2>
        {sale.payments.length === 0 ? (
          <p className="text-sm text-neutral-500">Aún no hay pagos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-neutral-700">Fecha</th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-700">Monto</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-700">Estado</th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sale.payments.map((p) => (
                  <tr key={p.id} className="border-t border-neutral-200">
                    <td className="px-3 py-2 text-neutral-700">{new Date(p.fecha).toLocaleDateString("es-PE")}</td>
                    <td className="px-3 py-2 text-right tabular-nums">S/ {Number(p.monto).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={p.estado === "CONFIRMADO" ? "success" : "danger"}>{p.estado}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {canAnularPago && p.estado === "CONFIRMADO" && (
                        <Button variant="ghost" size="sm" className="text-danger-600 hover:bg-danger-50" onClick={() => setVoidingPaymentId(p.id)}>
                          Anular
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {payingFinancing && (
        <RegisterPaymentModal
          open={!!payingFinancing}
          onOpenChange={(open) => !open && setPayingFinancing(null)}
          financiamientoId={payingFinancing.id}
          sedeVentaId={sale.sedeVentaId}
          pendiente={
            Number(
              cuenta?.porFinanciador.find((pf) => pf.financiamientoId === payingFinancing.id)?.pendiente ??
                payingFinancing.monto,
            )
          }
          onSuccess={refetch}
        />
      )}

      {voidingPaymentId && (
        <Modal
          open={!!voidingPaymentId}
          onOpenChange={(open) => !open && setVoidingPaymentId(null)}
          title="Anular pago"
          footer={
            <>
              <Button variant="secondary" onClick={() => setVoidingPaymentId(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleVoidPayment} disabled={motivo.trim().length < 3}>
                Anular pago
              </Button>
            </>
          }
        >
          <Label htmlFor="motivo-pago">Motivo (obligatorio)</Label>
          <Textarea id="motivo-pago" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Modal>
      )}

      {anulandoVenta && (
        <Modal
          open={anulandoVenta}
          onOpenChange={setAnulandoVenta}
          title="Anular venta"
          footer={
            <>
              <Button variant="secondary" onClick={() => setAnulandoVenta(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleVoidSale} disabled={motivo.trim().length < 3}>
                Anular venta
              </Button>
            </>
          }
        >
          <p className="mb-3 text-sm text-neutral-700">
            El stock descontado se reingresará y la venta pasará a estado ANULADA. Esta acción no se puede deshacer.
          </p>
          <Label htmlFor="motivo-venta">Motivo (obligatorio)</Label>
          <Textarea id="motivo-venta" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Modal>
      )}
    </div>
  );
}
