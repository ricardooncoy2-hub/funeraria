"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchCustomers } from "@/lib/api/customers";
import { ApiError } from "@/lib/api/client";
import { fetchAllPlans } from "@/lib/api/plans";
import { fetchAllProducts } from "@/lib/api/products";
import { type CreateQuotationInput, ORIGENES_INTERNOS, createQuotation } from "@/lib/api/quotations";
import { fetchAllServices } from "@/lib/api/services";
import { useAuthorizedBranches } from "@/lib/api/use-branches";
import { toast } from "@/lib/toast/toast-store";

const ITEM_TIPOS = ["PRODUCTO", "SERVICIO"] as const;

const itemSchema = z
  .object({
    itemTipo: z.enum(ITEM_TIPOS),
    productoId: z.string().optional(),
    servicioId: z.string().optional(),
    cantidad: z.coerce.number().positive("Debe ser mayor a cero."),
    precioReferencial: z.coerce.number().min(0).optional(),
  })
  .refine((v) => (v.itemTipo === "PRODUCTO" && !!v.productoId) || (v.itemTipo === "SERVICIO" && !!v.servicioId), {
    message: "Seleccione un ítem.",
    path: ["productoId"],
  });

const schema = z
  .object({
    origen: z.enum(ORIGENES_INTERNOS),
    solicitanteNombres: z.string().trim().min(1, "Ingrese el nombre.").max(150),
    solicitanteTelefono: z.string().trim().min(1, "Ingrese el teléfono.").max(30),
    solicitanteCorreo: z.email("Correo inválido.").max(150).optional().or(z.literal("")),
    clienteId: z.string().optional(),
    sedePreferidaId: z.string().optional(),
    tipoCotizacion: z.enum(["PLAN", "ITEMS"]),
    planId: z.string().optional(),
    items: z.array(itemSchema).optional(),
    observaciones: z.string().max(1000).optional().or(z.literal("")),
    validoHasta: z.string().optional().or(z.literal("")),
    consentimientoDatos: z.boolean(),
  })
  .refine((v) => v.consentimientoDatos === true, {
    message: "Debe registrar el consentimiento del titular de datos (Ley N.° 29733).",
    path: ["consentimientoDatos"],
  })
  .refine((v) => (v.tipoCotizacion === "PLAN" ? !!v.planId : (v.items?.length ?? 0) > 0), {
    message: "Seleccione un plan o agregue al menos un ítem.",
    path: ["planId"],
  });

type FormOutput = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export function QuotationFormModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [clienteSearch, setClienteSearch] = useState("");
  const { branches } = useAuthorizedBranches();
  const productsQuery = useQuery({ queryKey: ["productos", "all"], queryFn: fetchAllProducts });
  const servicesQuery = useQuery({ queryKey: ["servicios", "all"], queryFn: fetchAllServices });
  const plansQuery = useQuery({ queryKey: ["planes", "all"], queryFn: fetchAllPlans });
  const customersQuery = useQuery({
    queryKey: ["clientes", "buscar", clienteSearch],
    queryFn: () => fetchCustomers({ q: clienteSearch || undefined, pageSize: 20 }),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      origen: "WHATSAPP",
      solicitanteNombres: "",
      solicitanteTelefono: "",
      solicitanteCorreo: "",
      clienteId: "",
      sedePreferidaId: "",
      tipoCotizacion: "ITEMS",
      items: [{ itemTipo: "PRODUCTO", cantidad: 1 }],
      observaciones: "",
      validoHasta: "",
      consentimientoDatos: false,
    },
  });

  const itemsArray = useFieldArray({ control, name: "items" });
  const tipoCotizacion = watch("tipoCotizacion");
  const watchedItems = watch("items");
  const watchedClienteId = watch("clienteId");
  const selectedCliente = (customersQuery.data?.data ?? []).find((c) => c.id === watchedClienteId);
  const clienteLabel = selectedCliente ? [selectedCliente.nombres, selectedCliente.apellidos].filter(Boolean).join(" ") : "";

  async function onSubmit(values: FormOutput) {
    try {
      const input: CreateQuotationInput = {
        origen: values.origen,
        solicitanteNombres: values.solicitanteNombres,
        solicitanteTelefono: values.solicitanteTelefono,
        solicitanteCorreo: values.solicitanteCorreo || undefined,
        clienteId: values.clienteId || undefined,
        sedePreferidaId: values.sedePreferidaId || undefined,
        observaciones: values.observaciones || undefined,
        validoHasta: values.validoHasta || undefined,
        consentimientoDatos: values.consentimientoDatos,
        planId: values.tipoCotizacion === "PLAN" ? values.planId : undefined,
        items: values.tipoCotizacion === "ITEMS" ? values.items : undefined,
      };
      const quotation = await createQuotation(input);
      toast.success(`Cotización ${quotation.codigo} creada correctamente.`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo crear la cotización.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Nueva cotización" size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div>
            <Label htmlFor="sedePreferidaId">Sede preferida (opcional)</Label>
            <Controller
              control={control}
              name="sedePreferidaId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="sedePreferidaId">
                    <SelectValue placeholder="Sin preferencia" />
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
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <div>
            <Label htmlFor="solicitanteCorreo">Correo (opcional)</Label>
            <Input id="solicitanteCorreo" type="email" invalid={!!errors.solicitanteCorreo} {...register("solicitanteCorreo")} />
            <FieldError id="solicitanteCorreo-error" message={errors.solicitanteCorreo?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="clienteSearch">Cliente vinculado (opcional)</Label>
          <Controller
            control={control}
            name="clienteId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="clienteSearch">
                  <SelectValue placeholder="Sin cliente">{clienteLabel || undefined}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="p-1.5">
                    <Input
                      placeholder="Buscar por nombre o documento…"
                      value={clienteSearch}
                      onChange={(e) => setClienteSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  {(customersQuery.data?.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {[c.nombres, c.apellidos].filter(Boolean).join(" ")} — {c.numeroDocumento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="mt-1 text-xs text-neutral-500">Requerido para poder convertir la cotización en venta más adelante.</p>
        </div>

        <div>
          <Label htmlFor="tipoCotizacion">¿Qué se cotiza?</Label>
          <Controller
            control={control}
            name="tipoCotizacion"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="tipoCotizacion">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ITEMS">Productos / servicios individuales</SelectItem>
                  <SelectItem value="PLAN">Un plan</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {tipoCotizacion === "PLAN" ? (
          <div>
            <Label htmlFor="planId">Plan</Label>
            <Controller
              control={control}
              name="planId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="planId" invalid={!!errors.planId}>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {(plansQuery.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id="planId-error" message={errors.planId?.message} />
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Ítems</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => itemsArray.append({ itemTipo: "PRODUCTO", cantidad: 1 })}>
                Agregar ítem
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {itemsArray.fields.map((field, index) => {
                const tipo = watchedItems?.[index]?.itemTipo ?? "PRODUCTO";
                const catalog = tipo === "PRODUCTO" ? productsQuery.data : servicesQuery.data;
                const fieldName = tipo === "PRODUCTO" ? "productoId" : "servicioId";
                return (
                  <div key={field.id} className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-[110px_1fr_90px_110px_auto]">
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
                    <Controller
                      control={control}
                      name={`items.${index}.${fieldName}`}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger invalid={!!errors.items?.[index]?.productoId}>
                            <SelectValue placeholder="Seleccionar…" />
                          </SelectTrigger>
                          <SelectContent>
                            {(catalog ?? []).map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <Input type="number" step="0.001" min="0" placeholder="Cant." {...register(`items.${index}.cantidad`)} />
                    <Input type="number" step="0.01" min="0" placeholder="Precio ref." {...register(`items.${index}.precioReferencial`)} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="self-center text-danger-600 hover:bg-danger-50"
                      onClick={() => itemsArray.remove(index)}
                      disabled={itemsArray.fields.length === 1}
                      aria-label="Quitar ítem"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                );
              })}
            </div>
            <FieldError id="items-error" message={errors.planId?.message} />
          </div>
        )}

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

        <Controller
          control={control}
          name="consentimientoDatos"
          render={({ field }) => (
            <label className="flex items-start gap-2 text-sm text-neutral-700">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              <span>
                El titular de los datos ha dado su consentimiento para el tratamiento de su información personal
                (Ley N.° 29733).
              </span>
            </label>
          )}
        />
        <FieldError id="consentimiento-error" message={errors.consentimientoDatos?.message} />

        {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Crear cotización
          </Button>
        </div>
      </form>
    </Modal>
  );
}
