"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { fetchCategories } from "@/lib/api/products";
import { type Product, type ProductInput, createProduct, updateProduct } from "@/lib/api/products";
import { toast } from "@/lib/toast/toast-store";

const schema = z.object({
  codigo: z.string().trim().min(1, "Ingrese un código.").max(40),
  nombre: z.string().trim().min(1, "Ingrese un nombre.").max(200),
  descripcion: z.string().optional().or(z.literal("")),
  categoriaProductoId: z.string().min(1, "Seleccione una categoría."),
  unidadMedida: z.string().trim().min(1, "Ingrese la unidad de medida.").max(20),
  precioVenta: z.coerce.number().min(0, "El precio no puede ser negativo."),
  afectoIgv: z.boolean(),
});

type FormValues = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export function ProductFormModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  onSuccess: () => void;
}) {
  const categoriesQuery = useQuery({ queryKey: ["categorias-producto"], queryFn: fetchCategories, enabled: open });

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
      codigo: product?.codigo ?? "",
      nombre: product?.nombre ?? "",
      descripcion: product?.descripcion ?? "",
      categoriaProductoId: product?.categoriaProductoId ?? "",
      unidadMedida: product?.unidadMedida ?? "UNIDAD",
      precioVenta: product ? Number(product.precioVenta) : 0,
      afectoIgv: product?.afectoIgv ?? true,
    });
  }, [open, product, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const input: ProductInput = {
        ...values,
        descripcion: values.descripcion || undefined,
      };
      if (product) {
        await updateProduct(product.id, input);
        toast.success(`${values.nombre} se actualizó correctamente.`);
      } else {
        await createProduct(input);
        toast.success(`${values.nombre} se creó correctamente.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el producto.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={product ? "Editar producto" : "Nuevo producto"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="codigo">Código (SKU)</Label>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="categoriaProductoId">Categoría</Label>
            <Controller
              control={control}
              name="categoriaProductoId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="categoriaProductoId" invalid={!!errors.categoriaProductoId}>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoriesQuery.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="categoria-error" message={errors.categoriaProductoId?.message} />
          </div>
          <div>
            <Label htmlFor="unidadMedida">Unidad de medida</Label>
            <Input id="unidadMedida" invalid={!!errors.unidadMedida} {...register("unidadMedida")} />
            <FieldError id="unidad-error" message={errors.unidadMedida?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
          <div>
            <Label htmlFor="precioVenta">Precio de venta (S/)</Label>
            <Input
              id="precioVenta"
              type="number"
              step="0.01"
              min="0"
              invalid={!!errors.precioVenta}
              {...register("precioVenta")}
            />
            <FieldError id="precio-error" message={errors.precioVenta?.message} />
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
