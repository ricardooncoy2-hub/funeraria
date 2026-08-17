"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthorizedBranches } from "@/lib/api/use-branches";
import { ApiError } from "@/lib/api/client";
import { type PaymentInput, createPayment, fetchDestinosPago, fetchPaymentMethods } from "@/lib/api/payments";
import { toast } from "@/lib/toast/toast-store";

const schema = z.object({
  metodoPagoId: z.string().min(1, "Seleccione un método."),
  destinoPagoId: z.string().min(1, "Seleccione un destino."),
  sedeCobroId: z.string().min(1, "Seleccione la sede de cobro."),
  monto: z.coerce.number().positive("Debe ser mayor a cero."),
  referencia: z.string().max(100).optional().or(z.literal("")),
});

type FormOutput = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export function RegisterPaymentModal({
  open,
  onOpenChange,
  financiamientoId,
  sedeVentaId,
  pendiente,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  financiamientoId: string;
  sedeVentaId: string;
  pendiente: number;
  onSuccess: () => void;
}) {
  const { branches } = useAuthorizedBranches();
  const methodsQuery = useQuery({ queryKey: ["metodos-pago"], queryFn: fetchPaymentMethods, enabled: open });
  const destinosQuery = useQuery({ queryKey: ["destinos-pago"], queryFn: fetchDestinosPago, enabled: open });

  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { sedeCobroId: sedeVentaId, monto: pendiente },
  });

  const metodoPagoId = watch("metodoPagoId");
  const metodoSeleccionado = (methodsQuery.data ?? []).find((m) => m.id === metodoPagoId);
  const destinosFiltrados = (destinosQuery.data ?? []).filter((d) =>
    metodoSeleccionado ? (metodoSeleccionado.esEfectivo ? d.tipo === "CAJA" : d.tipo !== "CAJA") : true,
  );

  async function onSubmit(values: FormOutput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const input: PaymentInput = { ...values, financiamientoId, referencia: values.referencia || undefined };
      await createPayment(input);
      toast.success("Pago registrado correctamente.");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo registrar el pago.";
      setError("root", { message });
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Registrar pago" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <Label htmlFor="metodoPagoId">Método de pago</Label>
          <Controller
            control={control}
            name="metodoPagoId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="metodoPagoId" invalid={!!errors.metodoPagoId}>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {(methodsQuery.data ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError id="metodo-error" message={errors.metodoPagoId?.message} />
        </div>

        <div>
          <Label htmlFor="destinoPagoId">Destino del dinero</Label>
          <Controller
            control={control}
            name="destinoPagoId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="destinoPagoId" invalid={!!errors.destinoPagoId}>
                  <SelectValue placeholder="Seleccionar destino" />
                </SelectTrigger>
                <SelectContent>
                  {destinosFiltrados.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError id="destino-error" message={errors.destinoPagoId?.message} />
          {metodoSeleccionado?.esEfectivo && (
            <p className="mt-1.5 text-xs text-neutral-500">
              Requiere una caja abierta en la sede de cobro (RB-008/026).
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="sedeCobroId">Sede de cobro</Label>
          <Controller
            control={control}
            name="sedeCobroId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="sedeCobroId" invalid={!!errors.sedeCobroId}>
                  <SelectValue placeholder="Seleccionar sede" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError id="sedeCobro-error" message={errors.sedeCobroId?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="monto">Monto (pendiente: S/ {pendiente.toFixed(2)})</Label>
            <Input id="monto" type="number" step="0.01" min="0" invalid={!!errors.monto} {...register("monto")} />
            <FieldError id="monto-error" message={errors.monto?.message} />
          </div>
          <div>
            <Label htmlFor="referencia">Referencia (opcional)</Label>
            <Input id="referencia" {...register("referencia")} />
          </div>
        </div>

        {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Registrar pago
          </Button>
        </div>
      </form>
    </Modal>
  );
}
