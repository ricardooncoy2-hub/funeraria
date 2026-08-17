"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { registrarMovimiento } from "@/lib/api/cash";
import { toast } from "@/lib/toast/toast-store";

const TIPOS = ["INGRESO", "EGRESO", "RETIRO"] as const;

const schema = z.object({
  tipo: z.enum(TIPOS),
  monto: z.coerce.number().positive("Debe ser mayor a cero."),
  concepto: z.string().trim().min(1, "Ingrese el concepto.").max(255),
});

type FormOutput = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export function RegisterMovementModal({
  open,
  onOpenChange,
  aperturaId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aperturaId: string;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: "INGRESO", concepto: "" },
  });

  async function onSubmit(values: FormOutput) {
    try {
      await registrarMovimiento(aperturaId, values);
      toast.success("Movimiento registrado correctamente.");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo registrar el movimiento.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Registrar movimiento" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label htmlFor="monto">Monto</Label>
          <Input id="monto" type="number" step="0.01" min="0" invalid={!!errors.monto} {...register("monto")} />
          <FieldError id="monto-error" message={errors.monto?.message} />
        </div>

        <div>
          <Label htmlFor="concepto">Concepto</Label>
          <Textarea id="concepto" invalid={!!errors.concepto} {...register("concepto")} />
          <FieldError id="concepto-error" message={errors.concepto?.message} />
        </div>

        {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Registrar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
