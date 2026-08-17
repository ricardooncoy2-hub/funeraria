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
import { LocationSelect } from "@/components/ui/location-select";
import { Modal } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { type Supplier, type SupplierInput, createSupplier, updateSupplier } from "@/lib/api/suppliers";
import { toast } from "@/lib/toast/toast-store";

const TIPOS_DOCUMENTO = ["DNI", "CE", "RUC"] as const;

const schema = z.object({
  tipoDocumento: z.enum(TIPOS_DOCUMENTO),
  numeroDocumento: z.string().trim().min(1, "Ingrese el número de documento.").max(20),
  razonSocial: z.string().trim().min(1, "Ingrese la razón social.").max(200),
  nombreComercial: z.string().max(200).optional().or(z.literal("")),
  telefono: z.string().max(30).optional().or(z.literal("")),
  correo: z.email("Correo inválido.").max(150).optional().or(z.literal("")),
  direccion: z.string().max(255).optional().or(z.literal("")),
  distritoId: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function SupplierFormModal({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
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
      tipoDocumento: supplier?.tipoDocumento ?? "RUC",
      numeroDocumento: supplier?.numeroDocumento ?? "",
      razonSocial: supplier?.razonSocial ?? "",
      nombreComercial: supplier?.nombreComercial ?? "",
      telefono: supplier?.telefono ?? "",
      correo: supplier?.correo ?? "",
      direccion: supplier?.direccion ?? "",
      distritoId: supplier?.distritoId ?? "",
    });
  }, [open, supplier, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const input: SupplierInput = {
        ...values,
        nombreComercial: values.nombreComercial || undefined,
        telefono: values.telefono || undefined,
        correo: values.correo || undefined,
        direccion: values.direccion || undefined,
        distritoId: values.distritoId || undefined,
      };
      if (supplier) {
        await updateSupplier(supplier.id, input);
        toast.success(`${values.razonSocial} se actualizó correctamente.`);
      } else {
        await createSupplier(input);
        toast.success(`${values.razonSocial} se creó correctamente.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el proveedor.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={supplier ? "Editar proveedor" : "Nuevo proveedor"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[120px_1fr]">
          <div>
            <Label htmlFor="tipoDocumento">Tipo doc.</Label>
            <Controller
              control={control}
              name="tipoDocumento"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="tipoDocumento">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((t) => (
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
            <Label htmlFor="numeroDocumento">Número de documento</Label>
            <Input id="numeroDocumento" invalid={!!errors.numeroDocumento} {...register("numeroDocumento")} />
            <FieldError id="numeroDocumento-error" message={errors.numeroDocumento?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="razonSocial">Razón social</Label>
          <Input id="razonSocial" invalid={!!errors.razonSocial} {...register("razonSocial")} />
          <FieldError id="razonSocial-error" message={errors.razonSocial?.message} />
        </div>

        <div>
          <Label htmlFor="nombreComercial">Nombre comercial (opcional)</Label>
          <Input id="nombreComercial" {...register("nombreComercial")} />
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
