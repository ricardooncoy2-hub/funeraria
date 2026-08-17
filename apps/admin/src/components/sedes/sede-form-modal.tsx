"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationSelect } from "@/components/ui/location-select";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { type Branch, type BranchInput, createBranch, updateBranch } from "@/lib/api/branches";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/toast/toast-store";

const schema = z.object({
  codigo: z.string().trim().min(1, "Ingrese un código.").max(20, "Máximo 20 caracteres."),
  nombre: z.string().trim().min(1, "Ingrese un nombre.").max(150, "Máximo 150 caracteres."),
  descripcion: z.string().max(500).optional().or(z.literal("")),
  direccion: z.string().max(255).optional().or(z.literal("")),
  distritoId: z.string().optional().or(z.literal("")),
  telefono: z.string().max(30).optional().or(z.literal("")),
  correo: z.email("Correo inválido.").max(150).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function toInput(values: FormValues): BranchInput {
  return {
    codigo: values.codigo,
    nombre: values.nombre,
    descripcion: values.descripcion || undefined,
    direccion: values.direccion || undefined,
    distritoId: values.distritoId || undefined,
    telefono: values.telefono || undefined,
    correo: values.correo || undefined,
  };
}

export function SedeFormModal({
  open,
  onOpenChange,
  sede,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = editar; ausente = crear. */
  sede?: Branch;
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
      codigo: sede?.codigo ?? "",
      nombre: sede?.nombre ?? "",
      descripcion: sede?.descripcion ?? "",
      direccion: sede?.direccion ?? "",
      distritoId: sede?.distritoId ?? "",
      telefono: sede?.telefono ?? "",
      correo: sede?.correo ?? "",
    });
  }, [open, sede, reset]);

  async function onSubmit(values: FormValues) {
    try {
      if (sede) {
        await updateBranch(sede.id, toInput(values));
        toast.success(`${values.nombre} se actualizó correctamente.`);
      } else {
        await createBranch(toInput(values));
        toast.success(`${values.nombre} se creó correctamente.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar la sede.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={sede ? "Editar sede" : "Nueva sede"} size="md">
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

        <div>
          <Label htmlFor="direccion">Dirección (opcional)</Label>
          <Input id="direccion" {...register("direccion")} />
        </div>

        <div>
          <Label>Ubicación (opcional)</Label>
          <Controller
            control={control}
            name="distritoId"
            render={({ field }) => (
              <LocationSelect value={field.value || undefined} onChange={(v) => field.onChange(v ?? "")} />
            )}
          />
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
