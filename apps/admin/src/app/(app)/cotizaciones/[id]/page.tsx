"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { AssignQuotationModal } from "@/components/cotizaciones/assign-quotation-modal";
import { QuotationEditModal } from "@/components/cotizaciones/quotation-edit-modal";
import { QuotationStateControl } from "@/components/cotizaciones/quotation-state-control";
import { ApiError } from "@/lib/api/client";
import { convertirQuotationVenta, fetchQuotation } from "@/lib/api/quotations";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";
import { toast } from "@/lib/toast/toast-store";

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canGestionar = hasPermission(user, "cotizaciones.gestionar");
  const canCrearVenta = hasPermission(user, "ventas.crear");

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  const query = useQuery({ queryKey: ["cotizaciones", id], queryFn: () => fetchQuotation(id) });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: ["cotizaciones", id] });
    queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
  }

  async function handleConvertir() {
    setConverting(true);
    try {
      const sale = await convertirQuotationVenta(id);
      toast.success(`Venta ${sale.codigo} creada a partir de la cotización.`);
      router.push(`/ventas/${sale.id}`);
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo convertir la cotización en venta.");
      setConverting(false);
    }
  }

  if (query.isLoading) return <PageSpinner />;
  if (query.isError || !query.data) {
    return (
      <Card>
        <p className="text-sm text-danger-600">
          {query.error instanceof ApiError ? query.error.message : "No se pudo cargar la cotización."}
        </p>
      </Card>
    );
  }

  const quotation = query.data;
  const puedeConvertir = quotation.estado === "ACEPTADA" && canCrearVenta;
  const puedeAsignar = quotation.estado === "EN_REVISION" && canGestionar;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/cotizaciones")}
            className="mb-1 flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-950"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Cotizaciones
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-neutral-950">{quotation.codigo}</h1>
            {canGestionar ? (
              <QuotationStateControl id={quotation.id} estado={quotation.estado} onChanged={refetch} />
            ) : (
              <span className="text-sm text-neutral-500">{quotation.estado}</span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {canGestionar && (
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Editar
            </Button>
          )}
          {puedeAsignar && <Button onClick={() => setAssignOpen(true)}>Asignar a sede</Button>}
          {quotation.estado === "ACEPTADA" && (
            <Button onClick={handleConvertir} loading={converting} disabled={!puedeConvertir}>
              Convertir a venta
            </Button>
          )}
        </div>
      </div>

      {quotation.estado === "ACEPTADA" && !quotation.clienteId && (
        <Banner variant="warning">
          Esta cotización no tiene un cliente vinculado; edítela o cree una nueva con cliente para poder convertirla en
          venta.
        </Banner>
      )}

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-neutral-950">Solicitante</h2>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-neutral-500">Nombre</p>
            <p className="font-medium text-neutral-950">{quotation.solicitanteNombres}</p>
          </div>
          <div>
            <p className="text-neutral-500">Teléfono</p>
            <p className="font-medium text-neutral-950">{quotation.solicitanteTelefono}</p>
          </div>
          <div>
            <p className="text-neutral-500">Correo</p>
            <p className="font-medium text-neutral-950">{quotation.solicitanteCorreo || "—"}</p>
          </div>
          <div>
            <p className="text-neutral-500">Origen</p>
            <p className="font-medium text-neutral-950">{quotation.origen}</p>
          </div>
          <div>
            <p className="text-neutral-500">Fecha</p>
            <p className="font-medium text-neutral-950">{new Date(quotation.fecha).toLocaleDateString("es-PE")}</p>
          </div>
          <div>
            <p className="text-neutral-500">Válido hasta</p>
            <p className="font-medium text-neutral-950">
              {quotation.validoHasta ? new Date(quotation.validoHasta).toLocaleDateString("es-PE") : "—"}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">Cliente vinculado</p>
            <p className="font-medium text-neutral-950">
              {quotation.cliente
                ? [quotation.cliente.nombres, quotation.cliente.apellidos].filter(Boolean).join(" ")
                : "Sin vincular"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-neutral-950">Sede</h2>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-neutral-500">Preferida</p>
            <p className="font-medium text-neutral-950">{quotation.sedePreferida?.nombre ?? "—"}</p>
          </div>
          <div>
            <p className="text-neutral-500">Asignada</p>
            <p className="font-medium text-neutral-950">{quotation.sedeAsignada?.nombre ?? "Sin asignar"}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-neutral-950">{quotation.plan ? "Plan" : "Ítems"}</h2>
        {quotation.plan ? (
          <p className="text-sm font-medium text-neutral-950">{quotation.plan.nombre}</p>
        ) : quotation.items.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin ítems registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-neutral-700">Descripción</th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-700">Cantidad</th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-700">Precio referencial</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item) => (
                  <tr key={item.id} className="border-t border-neutral-200">
                    <td className="px-3 py-2 text-neutral-950">{item.producto?.nombre ?? item.servicio?.nombre}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{item.cantidad}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {item.precioReferencial ? `S/ ${Number(item.precioReferencial).toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {quotation.observaciones && (
        <Card>
          <h2 className="mb-2 text-lg font-semibold text-neutral-950">Observaciones</h2>
          <p className="text-sm text-neutral-700">{quotation.observaciones}</p>
        </Card>
      )}

      {editOpen && (
        <QuotationEditModal open={editOpen} onOpenChange={setEditOpen} quotation={quotation} onSuccess={refetch} />
      )}
      {assignOpen && (
        <AssignQuotationModal
          open={assignOpen}
          onOpenChange={setAssignOpen}
          quotationId={quotation.id}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
