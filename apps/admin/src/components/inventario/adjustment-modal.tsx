"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
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
import { useAuthorizedBranches } from "@/lib/api/use-branches";
import { ApiError } from "@/lib/api/client";
import { type AdjustmentInput, createAdjustment } from "@/lib/api/inventory";
import { fetchAllProducts } from "@/lib/api/products";
import { toast } from "@/lib/toast/toast-store";

const TIPOS = [
  { value: "AJUSTE_ENTRADA", label: "Ajuste de entrada" },
  { value: "AJUSTE_SALIDA", label: "Ajuste de salida" },
  { value: "MERMA", label: "Merma" },
] as const;

const schema = z.object({
  sedeId: z.string().min(1, "Seleccione una sede."),
  productoId: z.string().min(1, "Seleccione un producto."),
  tipo: z.enum(["AJUSTE_ENTRADA", "AJUSTE_SALIDA", "MERMA"]),
  cantidad: z.coerce.number().positive("Debe ser mayor a cero."),
  motivo: z.string().trim().min(3, "El motivo debe tener al menos 3 caracteres.").max(255),
});

type FormOutput = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export function AdjustmentModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { branches } = useAuthorizedBranches();
  const productsQuery = useQuery({ queryKey: ["productos", "all"], queryFn: fetchAllProducts, enabled: open });

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: "AJUSTE_ENTRADA" },
  });

  async function onSubmit(values: FormOutput) {
    try {
      await createAdjustment(values as AdjustmentInput);
      toast.success("Ajuste registrado correctamente.");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo registrar el ajuste.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Ajuste de inventario" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <Label htmlFor="sedeId">Sede</Label>
          <Controller
            control={control}
            name="sedeId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="sedeId" invalid={!!errors.sedeId}>
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
          <FieldError id="sede-error" message={errors.sedeId?.message} />
        </div>

        <div>
          <Label htmlFor="productoId">Producto</Label>
          <Controller
            control={control}
            name="productoId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="productoId" invalid={!!errors.productoId}>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {(productsQuery.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError id="producto-error" message={errors.productoId?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="tipo">Tipo de ajuste</Label>
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
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input id="cantidad" type="number" step="0.001" min="0" invalid={!!errors.cantidad} {...register("cantidad")} />
            <FieldError id="cantidad-error" message={errors.cantidad?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="motivo">Motivo</Label>
          <Textarea id="motivo" invalid={!!errors.motivo} {...register("motivo")} />
          <FieldError id="motivo-error" message={errors.motivo?.message} />
        </div>

        {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Registrar ajuste
          </Button>
        </div>
      </form>
    </Modal>
  );
}
