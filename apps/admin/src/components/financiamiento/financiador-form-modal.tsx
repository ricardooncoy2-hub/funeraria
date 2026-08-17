"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  type Financiador,
  type FinanciadorInput,
  TIPOS_FINANCIADOR,
  createFinanciador,
  updateFinanciador,
} from "@/lib/api/financing";
import { toast } from "@/lib/toast/toast-store";

const schema = z.object({
  tipo: z.enum(TIPOS_FINANCIADOR),
  nombre: z.string().trim().min(1, "Ingrese el nombre.").max(200),
  tipoDocumento: z.string().max(10).optional().or(z.literal("")),
  numeroDocumento: z.string().max(20).optional().or(z.literal("")),
  telefono: z.string().max(30).optional().or(z.literal("")),
  correo: z.email("Correo inválido.").max(150).optional().or(z.literal("")),
  diasCredito: z.coerce.number().int().min(0).optional(),
});

type FormOutput = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export function FinanciadorFormModal({
  open,
  onOpenChange,
  financiador,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  financiador?: Financiador;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset({
      tipo: financiador?.tipo ?? "SIS",
      nombre: financiador?.nombre ?? "",
      tipoDocumento: financiador?.tipoDocumento ?? "",
      numeroDocumento: financiador?.numeroDocumento ?? "",
      telefono: financiador?.telefono ?? "",
      correo: financiador?.correo ?? "",
      diasCredito: financiador?.diasCredito ?? undefined,
    });
  }, [open, financiador, reset]);

  async function onSubmit(values: FormOutput) {
    try {
      const input: FinanciadorInput = {
        ...values,
        tipoDocumento: values.tipoDocumento || undefined,
        numeroDocumento: values.numeroDocumento || undefined,
        telefono: values.telefono || undefined,
        correo: values.correo || undefined,
      };
      if (financiador) {
        await updateFinanciador(financiador.id, input);
        toast.success(`${values.nombre} se actualizó correctamente.`);
      } else {
        await createFinanciador(input);
        toast.success(`${values.nombre} se creó correctamente.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el financiador.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={financiador ? "Editar financiador" : "Nuevo financiador"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
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
                    {TIPOS_FINANCIADOR.map((t) => (
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
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" invalid={!!errors.nombre} {...register("nombre")} />
            <FieldError id="nombre-error" message={errors.nombre?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_1fr]">
          <div>
            <Label htmlFor="tipoDocumento">Tipo doc. (opcional)</Label>
            <Input id="tipoDocumento" {...register("tipoDocumento")} />
          </div>
          <div>
            <Label htmlFor="numeroDocumento">N.° documento (opcional)</Label>
            <Input id="numeroDocumento" {...register("numeroDocumento")} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="telefono">Teléfono (opcional)</Label>
            <Input id="telefono" {...register("telefono")} />
          </div>
          <div>
            <Label htmlFor="correo">Correo (opcional)</Label>
            <Input id="correo" type="email" invalid={!!errors.correo} {...register("correo")} />
            <FieldError id="correo-error" message={errors.correo?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="diasCredito">Días de crédito para CxC (opcional)</Label>
          <Input id="diasCredito" type="number" min="0" step="1" {...register("diasCredito")} />
        </div>

        {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
