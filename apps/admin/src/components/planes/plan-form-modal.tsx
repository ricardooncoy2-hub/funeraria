"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { type PlanDetail, type PlanInput, createPlan, updatePlan } from "@/lib/api/plans";
import { fetchAllProducts } from "@/lib/api/products";
import { fetchAllServices } from "@/lib/api/services";
import { toast } from "@/lib/toast/toast-store";

const itemSchema = z
  .object({
    itemTipo: z.enum(["PRODUCTO", "SERVICIO"]),
    productoId: z.string().optional(),
    servicioId: z.string().optional(),
    cantidad: z.coerce.number().positive("Debe ser mayor a cero."),
  })
  .refine((v) => (v.itemTipo === "PRODUCTO" ? !!v.productoId : !!v.servicioId), {
    message: "Seleccione un ítem.",
    path: ["productoId"],
  });

const schema = z.object({
  codigo: z.string().trim().min(1, "Ingrese un código.").max(40),
  nombre: z.string().trim().min(1, "Ingrese un nombre.").max(200),
  descripcion: z.string().optional().or(z.literal("")),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo."),
  afectoIgv: z.boolean(),
  items: z.array(itemSchema).min(1, "Agregue al menos un ítem."),
});

type FormValues = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export function PlanFormModal({
  open,
  onOpenChange,
  plan,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Detalle completo (con items) si se está editando; ausente = crear. */
  plan?: PlanDetail;
  onSuccess: () => void;
}) {
  const productsQuery = useQuery({ queryKey: ["productos", "all"], queryFn: fetchAllProducts, enabled: open });
  const servicesQuery = useQuery({ queryKey: ["servicios", "all"], queryFn: fetchAllServices, enabled: open });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (!open) return;
    reset({
      codigo: plan?.codigo ?? "",
      nombre: plan?.nombre ?? "",
      descripcion: plan?.descripcion ?? "",
      precio: plan ? Number(plan.precio) : 0,
      afectoIgv: plan?.afectoIgv ?? true,
      items: plan
        ? plan.items.map((i) => ({
            itemTipo: i.itemTipo,
            productoId: i.productoId ?? undefined,
            servicioId: i.servicioId ?? undefined,
            cantidad: Number(i.cantidad),
          }))
        : [{ itemTipo: "PRODUCTO", cantidad: 1 }],
    });
  }, [open, plan, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const input: PlanInput = { ...values, descripcion: values.descripcion || undefined };
      if (plan) {
        await updatePlan(plan.id, input);
        toast.success(`${values.nombre} se actualizó correctamente.`);
      } else {
        await createPlan(input);
        toast.success(`${values.nombre} se creó correctamente.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el plan.";
      setError("root", { message });
    }
  }

  const itemsLoading = productsQuery.isLoading || servicesQuery.isLoading;

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={plan ? "Editar plan" : "Nuevo plan"} size="md">
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
            <Label htmlFor="precio">Precio del paquete (S/)</Label>
            <Input id="precio" type="number" step="0.01" min="0" invalid={!!errors.precio} {...register("precio")} />
            <FieldError id="precio-error" message={errors.precio?.message} />
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

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Componentes del plan</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append({ itemTipo: "PRODUCTO", cantidad: 1 })}
              disabled={itemsLoading}
            >
              Agregar ítem
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const tipo = watch(`items.${index}.itemTipo`);
              return (
                <div key={field.id} className="flex items-start gap-2 rounded-md border border-neutral-200 p-3">
                  <div className="w-32 shrink-0">
                    <Controller
                      control={control}
                      name={`items.${index}.itemTipo`}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRODUCTO">Producto</SelectItem>
                            <SelectItem value="SERVICIO">Servicio</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="flex-1">
                    {tipo === "PRODUCTO" ? (
                      <Controller
                        control={control}
                        name={`items.${index}.productoId`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger invalid={!!errors.items?.[index]?.productoId}>
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
                    ) : (
                      <Controller
                        control={control}
                        name={`items.${index}.servicioId`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger invalid={!!errors.items?.[index]?.productoId}>
                              <SelectValue placeholder="Seleccionar servicio" />
                            </SelectTrigger>
                            <SelectContent>
                              {(servicesQuery.data ?? []).map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    )}
                    <FieldError id={`item-${index}-error`} message={errors.items?.[index]?.productoId?.message} />
                  </div>

                  <div className="w-24 shrink-0">
                    <Input type="number" step="0.001" min="0" placeholder="Cant." {...register(`items.${index}.cantidad`)} />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-0.5 shrink-0 text-danger-600 hover:bg-danger-50"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label="Quitar ítem"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              );
            })}
          </div>
          <FieldError id="items-error" message={errors.items?.root?.message ?? errors.items?.message} />
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
