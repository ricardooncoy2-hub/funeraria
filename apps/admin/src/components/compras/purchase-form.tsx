"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { fetchAllProducts } from "@/lib/api/products";
import {
  type PurchaseDetail,
  type PurchaseInput,
  createPurchase,
  updatePurchase,
} from "@/lib/api/purchases";
import { fetchAllSuppliers } from "@/lib/api/suppliers";
import { toast } from "@/lib/toast/toast-store";

const ESTIMATED_IGV_RATE = 0.18;

const itemSchema = z.object({
  productoId: z.string().min(1, "Seleccione un producto."),
  cantidad: z.coerce.number().positive("Debe ser mayor a cero."),
  costoUnitario: z.coerce.number().positive("Debe ser mayor a cero."),
  afectoIgv: z.boolean(),
});

const schema = z.object({
  proveedorId: z.string().min(1, "Seleccione un proveedor."),
  numeroDocumento: z.string().max(40).optional().or(z.literal("")),
  fecha: z.string().min(1, "Ingrese la fecha."),
  observaciones: z.string().max(500).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1, "Agregue al menos un ítem."),
});

type FormOutput = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PurchaseForm({ purchase }: { purchase?: PurchaseDetail }) {
  const router = useRouter();
  const suppliersQuery = useQuery({ queryKey: ["proveedores", "all"], queryFn: fetchAllSuppliers });
  const productsQuery = useQuery({ queryKey: ["productos", "all"], queryFn: fetchAllProducts });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: purchase
      ? {
          proveedorId: purchase.proveedorId,
          numeroDocumento: purchase.numeroDocumento ?? "",
          fecha: purchase.fecha.slice(0, 10),
          observaciones: purchase.observaciones ?? "",
          items: purchase.items.map((i) => ({
            productoId: i.productoId,
            cantidad: Number(i.cantidad),
            costoUnitario: Number(i.costoUnitario),
            afectoIgv: i.afectoIgv,
          })),
        }
      : {
          proveedorId: "",
          numeroDocumento: "",
          fecha: today(),
          observaciones: "",
          items: [{ productoId: "", cantidad: 1, costoUnitario: 0, afectoIgv: true }],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");

  const subtotal = (watchedItems ?? []).reduce(
    (acc, i) => acc + (Number(i?.cantidad) || 0) * (Number(i?.costoUnitario) || 0),
    0,
  );
  const igv = (watchedItems ?? []).reduce((acc, i) => {
    const line = (Number(i?.cantidad) || 0) * (Number(i?.costoUnitario) || 0);
    return acc + (i?.afectoIgv !== false ? line * ESTIMATED_IGV_RATE : 0);
  }, 0);

  async function onSubmit(values: FormOutput) {
    try {
      const input: PurchaseInput = {
        ...values,
        numeroDocumento: values.numeroDocumento || undefined,
        observaciones: values.observaciones || undefined,
      };
      if (purchase) {
        await updatePurchase(purchase.id, input);
        toast.success("Compra actualizada correctamente.");
        router.push(`/compras/${purchase.id}`);
      } else {
        const created = await createPurchase(input);
        toast.success("Compra creada en borrador.");
        router.push(`/compras/${created.id}`);
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar la compra.";
      setError("root", { message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="proveedorId">Proveedor</Label>
            <Controller
              control={control}
              name="proveedorId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="proveedorId" invalid={!!errors.proveedorId}>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(suppliersQuery.data ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.razonSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="proveedor-error" message={errors.proveedorId?.message} />
          </div>

          <div>
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" invalid={!!errors.fecha} {...register("fecha")} />
            <FieldError id="fecha-error" message={errors.fecha?.message} />
          </div>

          <div>
            <Label htmlFor="numeroDocumento">N.° de documento (opcional)</Label>
            <Input id="numeroDocumento" {...register("numeroDocumento")} />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="observaciones">Observaciones (opcional)</Label>
          <Textarea id="observaciones" {...register("observaciones")} />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-950">Ítems</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ productoId: "", cantidad: 1, costoUnitario: 0, afectoIgv: true })}
          >
            Agregar ítem
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-[1fr_100px_120px_auto_auto]">
              <div>
                <Controller
                  control={control}
                  name={`items.${index}.productoId`}
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger invalid={!!errors.items?.[index]?.productoId}>
                        <SelectValue placeholder="Producto" />
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
              </div>
              <Input type="number" step="0.001" min="0" placeholder="Cant." {...register(`items.${index}.cantidad`)} />
              <Input type="number" step="0.01" min="0" placeholder="Costo unit." {...register(`items.${index}.costoUnitario`)} />
              <label className="flex items-center gap-1.5 self-center text-xs whitespace-nowrap text-neutral-700">
                <Controller
                  control={control}
                  name={`items.${index}.afectoIgv`}
                  render={({ field: f }) => <Checkbox checked={f.value} onCheckedChange={f.onChange} />}
                />
                IGV
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-center text-danger-600 hover:bg-danger-50"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                aria-label="Quitar ítem"
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          ))}
        </div>
        <FieldError id="items-error" message={errors.items?.message} />

        <div className="mt-4 flex flex-col items-end gap-1 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex w-56 justify-between text-neutral-700">
            <span>Subtotal</span>
            <span className="tabular-nums">S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex w-56 justify-between text-neutral-700">
            <span>IGV (estimado)</span>
            <span className="tabular-nums">S/ {igv.toFixed(2)}</span>
          </div>
          <div className="flex w-56 justify-between text-base font-semibold text-neutral-950">
            <span>Total</span>
            <span className="tabular-nums">S/ {(subtotal + igv).toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {purchase ? "Guardar cambios" : "Crear compra en borrador"}
        </Button>
      </div>
    </form>
  );
}
