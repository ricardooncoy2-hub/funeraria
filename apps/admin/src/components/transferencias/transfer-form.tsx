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
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchAllBranches } from "@/lib/api/branches";
import { ApiError } from "@/lib/api/client";
import { fetchAllProducts } from "@/lib/api/products";
import { type TransferInput, createTransfer } from "@/lib/api/transfers";
import { useAuthorizedBranches } from "@/lib/api/use-branches";
import { toast } from "@/lib/toast/toast-store";

const schema = z
  .object({
    sedeOrigenId: z.string().min(1, "Seleccione la sede origen."),
    sedeDestinoId: z.string().min(1, "Seleccione la sede destino."),
    motivo: z.string().max(255).optional().or(z.literal("")),
    items: z
      .array(z.object({ productoId: z.string().min(1, "Seleccione un producto."), cantidad: z.coerce.number().positive("Debe ser mayor a cero.") }))
      .min(1, "Agregue al menos un ítem."),
  })
  .refine((v) => v.sedeOrigenId !== v.sedeDestinoId, {
    message: "La sede origen y destino no pueden ser la misma.",
    path: ["sedeDestinoId"],
  });

type FormOutput = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export function TransferForm() {
  const router = useRouter();
  const { branches: authorizedBranches } = useAuthorizedBranches();
  const allBranchesQuery = useQuery({ queryKey: ["sedes", "all"], queryFn: fetchAllBranches });
  const productsQuery = useQuery({ queryKey: ["productos", "all"], queryFn: fetchAllProducts });

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { sedeOrigenId: "", sedeDestinoId: "", motivo: "", items: [{ productoId: "", cantidad: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(values: FormOutput) {
    try {
      const input: TransferInput = { ...values, motivo: values.motivo || undefined };
      const created = await createTransfer(input);
      toast.success(`Transferencia ${created.codigo} solicitada correctamente.`);
      router.push(`/transferencias/${created.id}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo crear la transferencia.";
      setError("root", { message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sedeOrigenId">Sede origen</Label>
            <Controller
              control={control}
              name="sedeOrigenId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="sedeOrigenId" invalid={!!errors.sedeOrigenId}>
                    <SelectValue placeholder="Sede que envía" />
                  </SelectTrigger>
                  <SelectContent>
                    {authorizedBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="origen-error" message={errors.sedeOrigenId?.message} />
          </div>
          <div>
            <Label htmlFor="sedeDestinoId">Sede destino</Label>
            <Controller
              control={control}
              name="sedeDestinoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="sedeDestinoId" invalid={!!errors.sedeDestinoId}>
                    <SelectValue placeholder="Sede que recibe" />
                  </SelectTrigger>
                  <SelectContent>
                    {(allBranchesQuery.data ?? []).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="destino-error" message={errors.sedeDestinoId?.message} />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="motivo">Motivo (opcional)</Label>
          <Textarea id="motivo" {...register("motivo")} />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-950">Ítems</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => append({ productoId: "", cantidad: 1 })}>
            Agregar ítem
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-[1fr_120px_auto]">
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
              <Input type="number" step="0.001" min="0" placeholder="Cant." {...register(`items.${index}.cantidad`)} />
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
      </Card>

      {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Solicitar transferencia
        </Button>
      </div>
    </form>
  );
}
