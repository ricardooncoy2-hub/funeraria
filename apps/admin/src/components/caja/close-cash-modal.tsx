"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api/client";
import { cerrarCaja } from "@/lib/api/cash";
import { toast } from "@/lib/toast/toast-store";

const schema = z.object({
  saldoContado: z.coerce.number().min(0, "Debe ser mayor o igual a cero."),
});

type FormOutput = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export function CloseCashModal({
  open,
  onOpenChange,
  aperturaId,
  saldoTeorico,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aperturaId: string;
  saldoTeorico: number;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { saldoContado: saldoTeorico },
  });

  async function onSubmit(values: FormOutput) {
    try {
      await cerrarCaja(aperturaId, values.saldoContado);
      toast.success("Caja cerrada correctamente.");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo cerrar la caja.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Cerrar caja (arqueo)" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-neutral-700">
          Saldo teórico calculado: <strong>S/ {saldoTeorico.toFixed(2)}</strong>. Ingrese el monto contado físicamente.
        </p>
        <div>
          <Label htmlFor="saldoContado">Saldo contado</Label>
          <Input id="saldoContado" type="number" step="0.01" min="0" invalid={!!errors.saldoContado} {...register("saldoContado")} />
          <FieldError id="saldoContado-error" message={errors.saldoContado?.message} />
        </div>

        {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="destructive" loading={isSubmitting}>
            Cerrar caja
          </Button>
        </div>
      </form>
    </Modal>
  );
}
