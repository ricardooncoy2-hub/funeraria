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
import { type Cash, abrirCaja } from "@/lib/api/cash";
import { toast } from "@/lib/toast/toast-store";

const schema = z.object({
  saldoInicial: z.coerce.number().min(0, "Debe ser mayor o igual a cero."),
});

type FormOutput = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export function OpenCashModal({
  open,
  onOpenChange,
  caja,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caja: Cash;
  onSuccess: (aperturaId: string) => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { saldoInicial: 0 },
  });

  async function onSubmit(values: FormOutput) {
    try {
      const apertura = await abrirCaja(caja.id, values.saldoInicial);
      toast.success(`${caja.nombre} abierta correctamente.`);
      onSuccess(apertura.id);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo abrir la caja.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Abrir ${caja.nombre}`} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <Label htmlFor="saldoInicial">Saldo inicial en efectivo</Label>
          <Input id="saldoInicial" type="number" step="0.01" min="0" invalid={!!errors.saldoInicial} {...register("saldoInicial")} />
          <FieldError id="saldoInicial-error" message={errors.saldoInicial?.message} />
        </div>

        {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Abrir caja
          </Button>
        </div>
      </form>
    </Modal>
  );
}
