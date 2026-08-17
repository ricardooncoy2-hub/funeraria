"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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
import { ORIGENES_INTERNOS, type QuotationDetail, updateQuotation } from "@/lib/api/quotations";
import { toast } from "@/lib/toast/toast-store";

const schema = z.object({
  origen: z.enum(ORIGENES_INTERNOS),
  solicitanteNombres: z.string().trim().min(1, "Ingrese el nombre.").max(150),
  solicitanteTelefono: z.string().trim().min(1, "Ingrese el teléfono.").max(30),
  solicitanteCorreo: z.email("Correo inválido.").max(150).optional().or(z.literal("")),
  observaciones: z.string().max(1000).optional().or(z.literal("")),
  validoHasta: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function QuotationEditModal({
  open,
  onOpenChange,
  quotation,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: QuotationDetail;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset({
      origen: quotation.origen,
      solicitanteNombres: quotation.solicitanteNombres,
      solicitanteTelefono: quotation.solicitanteTelefono,
      solicitanteCorreo: quotation.solicitanteCorreo ?? "",
      observaciones: quotation.observaciones ?? "",
      validoHasta: quotation.validoHasta ? quotation.validoHasta.slice(0, 10) : "",
    });
  }, [open, quotation, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await updateQuotation(quotation.id, {
        ...values,
        solicitanteCorreo: values.solicitanteCorreo || undefined,
        observaciones: values.observaciones || undefined,
        validoHasta: values.validoHasta || undefined,
      });
      toast.success("Cotización actualizada correctamente.");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo actualizar la cotización.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Editar cotización" size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <Label htmlFor="origen">Origen</Label>
          <Controller
            control={control}
            name="origen"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="origen">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENES_INTERNOS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="solicitanteNombres">Nombre del solicitante</Label>
            <Input id="solicitanteNombres" invalid={!!errors.solicitanteNombres} {...register("solicitanteNombres")} />
            <FieldError id="solicitanteNombres-error" message={errors.solicitanteNombres?.message} />
          </div>
          <div>
            <Label htmlFor="solicitanteTelefono">Teléfono</Label>
            <Input id="solicitanteTelefono" invalid={!!errors.solicitanteTelefono} {...register("solicitanteTelefono")} />
            <FieldError id="solicitanteTelefono-error" message={errors.solicitanteTelefono?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="solicitanteCorreo">Correo (opcional)</Label>
          <Input id="solicitanteCorreo" type="email" invalid={!!errors.solicitanteCorreo} {...register("solicitanteCorreo")} />
          <FieldError id="solicitanteCorreo-error" message={errors.solicitanteCorreo?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="observaciones">Observaciones (opcional)</Label>
            <Textarea id="observaciones" {...register("observaciones")} />
          </div>
          <div>
            <Label htmlFor="validoHasta">Válido hasta (opcional)</Label>
            <Input id="validoHasta" type="date" {...register("validoHasta")} />
          </div>
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
