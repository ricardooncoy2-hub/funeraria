"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createTableColumns, DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { type Payment, anularPayment, fetchPayments } from "@/lib/api/payments";
import { useAuthorizedBranches } from "@/lib/api/use-branches";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";
import { toast } from "@/lib/toast/toast-store";

const METODOS = ["EFECTIVO", "TRANSFERENCIA", "POS", "YAPE"] as const;

const columnHelper = createTableColumns<Payment>();

export default function PagosPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canAnular = hasPermission(user, "pagos.anular");
  const { branches } = useAuthorizedBranches();

  const [page, setPage] = useState(1);
  const [sedeCobroId, setSedeCobroId] = useState<string>("");
  const [metodo, setMetodo] = useState<string>("");
  const [ventaId, setVentaId] = useState<string>("");
  const [voidingPayment, setVoidingPayment] = useState<Payment | null>(null);
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const query = useQuery({
    queryKey: ["pagos", { page, sedeCobroId, metodo, ventaId }],
    queryFn: () =>
      fetchPayments({
        page,
        sedeCobroId: sedeCobroId || undefined,
        metodo: metodo || undefined,
        ventaId: ventaId || undefined,
      }),
  });

  async function handleVoid() {
    if (!voidingPayment) return;
    setSubmitting(true);
    try {
      await anularPayment(voidingPayment.id, motivo);
      toast.success("Pago anulado correctamente.");
      setVoidingPayment(null);
      setMotivo("");
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
    } catch (error) {
      toast.danger(error instanceof ApiError ? error.message : "No se pudo anular el pago.");
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    columnHelper.accessor("fecha", {
      header: "Fecha",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("es-PE"),
    }),
    columnHelper.accessor((row) => row.venta.codigo, {
      id: "venta",
      header: "Venta",
      cell: (info) => (
        <button
          type="button"
          className="font-medium text-brand-700 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/ventas/${info.row.original.venta.id}`);
          }}
        >
          {info.getValue()}
        </button>
      ),
    }),
    columnHelper.accessor((row) => row.metodoPago.codigo, { id: "metodo", header: "Método" }),
    columnHelper.accessor((row) => row.destinoPago.nombre, { id: "destino", header: "Destino" }),
    columnHelper.accessor("monto", {
      header: "Monto",
      cell: (info) => <span className="tabular-nums">S/ {Number(info.getValue()).toFixed(2)}</span>,
    }),
    columnHelper.accessor("referencia", {
      header: "Referencia",
      cell: (info) => info.getValue() || <span className="text-neutral-400">—</span>,
    }),
    columnHelper.accessor("estado", {
      header: "Estado",
      cell: (info) => <Badge variant={info.getValue() === "CONFIRMADO" ? "success" : "danger"}>{info.getValue()}</Badge>,
    }),
    columnHelper.display({
      id: "acciones",
      header: "Acciones",
      cell: (info) => (
        <div className="flex justify-end">
          {canAnular && info.row.original.estado === "CONFIRMADO" && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setVoidingPayment(info.row.original);
              }}
            >
              Anular
            </Button>
          )}
        </div>
      ),
    }),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-950">Pagos</h1>
        <p className="mt-1 text-sm text-neutral-700">Pagos registrados en las sedes de cobro autorizadas.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="filtro-sede">Sede de cobro</Label>
          <Select value={sedeCobroId} onValueChange={(v) => { setSedeCobroId(v === "todas" ? "" : v); setPage(1); }}>
            <SelectTrigger id="filtro-sede">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filtro-metodo">Método de pago</Label>
          <Select value={metodo} onValueChange={(v) => { setMetodo(v === "todos" ? "" : v); setPage(1); }}>
            <SelectTrigger id="filtro-metodo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {METODOS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filtro-venta">ID de venta</Label>
          <Input
            id="filtro-venta"
            type="number"
            min="1"
            placeholder="Ej. 12"
            value={ventaId}
            onChange={(e) => { setVentaId(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof ApiError ? query.error.message : undefined}
        emptyTitle="No hay pagos que coincidan con los filtros"
      />

      {query.data && <Pagination meta={query.data.meta} onPageChange={setPage} />}

      {voidingPayment && (
        <Modal
          open={!!voidingPayment}
          onOpenChange={(open) => !open && setVoidingPayment(null)}
          title="Anular pago"
          footer={
            <>
              <Button variant="secondary" onClick={() => setVoidingPayment(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleVoid} loading={submitting} disabled={motivo.trim().length < 3}>
                Anular pago
              </Button>
            </>
          }
        >
          <p className="mb-3 text-sm text-neutral-700">
            Se anulará el pago de <strong>S/ {Number(voidingPayment.monto).toFixed(2)}</strong> de la venta{" "}
            <strong>{voidingPayment.venta.codigo}</strong>. El financiamiento asociado volverá a su estado pendiente.
          </p>
          <Label htmlFor="motivo-pago">Motivo (obligatorio)</Label>
          <Textarea id="motivo-pago" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Modal>
      )}
    </div>
  );
}
