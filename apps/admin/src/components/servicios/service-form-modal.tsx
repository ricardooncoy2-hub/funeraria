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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { type ServiceInput, type ServiceItem, createService, updateService } from "@/lib/api/services";
import { toast } from "@/lib/toast/toast-store";

const schema = z.object({
  codigo: z.string().trim().min(1, "Ingrese un código.").max(40),
  nombre: z.string().trim().min(1, "Ingrese un nombre.").max(200),
  descripcion: z.string().optional().or(z.literal("")),
  precioBase: z.coerce.number().min(0, "El precio no puede ser negativo."),
  afectoIgv: z.boolean(),
});

type FormValues = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export function ServiceFormModal({
  open,
  onOpenChange,
  service,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: ServiceItem;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset({
      codigo: service?.codigo ?? "",
      nombre: service?.nombre ?? "",
      descripcion: service?.descripcion ?? "",
      precioBase: service ? Number(service.precioBase) : 0,
      afectoIgv: service?.afectoIgv ?? true,
    });
  }, [open, service, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const input: ServiceInput = { ...values, descripcion: values.descripcion || undefined };
      if (service) {
        await updateService(service.id, input);
        toast.success(`${values.nombre} se actualizó correctamente.`);
      } else {
        await createService(input);
        toast.success(`${values.nombre} se creó correctamente.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el servicio.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={service ? "Editar servicio" : "Nuevo servicio"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" invalid={!!errors.codigo} {...register("codigo")} />
            <FieldError id="codigo-error" message={errors.codigo?.message} />
          </div>
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" invalid={!!errors.nombre} {...register("nombre")} />
            <FieldError id="nombre-error" message={errors.nombre?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="descripcion">Descripción (opcional)</Label>
          <Textarea id="descripcion" {...register("descripcion")} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <div>
            <Label htmlFor="precioBase">Precio base corporativo (S/)</Label>
            <Input
              id="precioBase"
              type="number"
              step="0.01"
              min="0"
              invalid={!!errors.precioBase}
              {...register("precioBase")}
            />
            <FieldError id="precio-error" message={errors.precioBase?.message} />
          </div>
          <Controller
            control={control}
            name="afectoIgv"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-md border border-neutral-200 px-4 py-3">
                <p className="text-sm font-medium text-neutral-950">Afecto a IGV</p>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        </div>

        <p className="text-xs text-neutral-500">
          Cada sede puede sobreescribir la disponibilidad y el precio de este servicio (RB-029) — esa
          configuración se maneja próximamente desde el detalle del servicio.
        </p>

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
