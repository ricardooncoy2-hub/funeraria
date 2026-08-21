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
import { TIPOS_DOCUMENTO, type Customer, type CustomerInput, createCustomer, updateCustomer } from "@/lib/api/customers";
import { toast } from "@/lib/toast/toast-store";

const schema = z.object({
  tipoDocumento: z.enum(TIPOS_DOCUMENTO),
  numeroDocumento: z.string().trim().min(1, "Ingrese el número de documento.").max(20),
  nombres: z.string().trim().min(1, "Ingrese los nombres.").max(150),
  apellidos: z.string().max(150).optional().or(z.literal("")),
  telefono: z.string().max(30).optional().or(z.literal("")),
  correo: z.email("Correo inválido.").max(150).optional().or(z.literal("")),
  direccion: z.string().max(255).optional().or(z.literal("")),
  distritoId: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function CustomerFormModal({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset({
      tipoDocumento: customer?.tipoDocumento ?? "DNI",
      numeroDocumento: customer?.numeroDocumento ?? "",
      nombres: customer?.nombres ?? "",
      apellidos: customer?.apellidos ?? "",
      telefono: customer?.telefono ?? "",
      correo: customer?.correo ?? "",
      direccion: customer?.direccion ?? "",
      distritoId: customer?.distritoId ?? "",
    });
  }, [open, customer, reset]);

  const tipoDocumento = watch("tipoDocumento");
  const esRuc = tipoDocumento === "RUC";

  async function onSubmit(values: FormValues) {
    try {
      const input: CustomerInput = {
        ...values,
        apellidos: esRuc ? undefined : values.apellidos || undefined,
        telefono: values.telefono || undefined,
        correo: values.correo || undefined,
        direccion: values.direccion || undefined,
        distritoId: values.distritoId || undefined,
      };
      if (customer) {
        await updateCustomer(customer.id, input);
        toast.success(`${values.nombres} se actualizó correctamente.`);
      } else {
        await createCustomer(input);
        toast.success(`${values.nombres} se creó correctamente.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        // Error inesperado (no una respuesta de negocio del backend) — se
        // loguea para poder diagnosticarlo, ya que el mensaje que ve el
        // usuario es genérico y no alcanza para saber la causa real.
        console.error("CustomerFormModal onSubmit:", error);
      }
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el cliente.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={customer ? "Editar cliente" : "Nuevo cliente"} size="md">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="nombres">{esRuc ? "Razón social" : "Nombres"}</Label>
            <Input id="nombres" invalid={!!errors.nombres} {...register("nombres")} />
            <FieldError id="nombres-error" message={errors.nombres?.message} />
          </div>
          {!esRuc && (
            <div>
              <Label htmlFor="apellidos">Apellidos (opcional)</Label>
              <Input id="apellidos" {...register("apellidos")} />
            </div>
          )}
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
