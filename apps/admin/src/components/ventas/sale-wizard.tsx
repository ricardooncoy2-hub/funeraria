"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import { fetchAllFinanciadores } from "@/lib/api/financing";
import { fetchAllProducts } from "@/lib/api/products";
import { fetchAllServices } from "@/lib/api/services";
import { fetchAllPlans } from "@/lib/api/plans";
import { ApiError } from "@/lib/api/client";
import { fetchCustomers } from "@/lib/api/customers";
import { type SaleInput, createSale } from "@/lib/api/sales";
import { useAuthorizedBranches } from "@/lib/api/use-branches";
import { toast } from "@/lib/toast/toast-store";

const ITEM_TIPOS = ["PRODUCTO", "SERVICIO", "PLAN"] as const;

const itemSchema = z
  .object({
    itemTipo: z.enum(ITEM_TIPOS),
    productoId: z.string().optional(),
    servicioId: z.string().optional(),
    planId: z.string().optional(),
    cantidad: z.coerce.number().positive("Debe ser mayor a cero."),
    descuentoLinea: z.coerce.number().min(0).optional(),
  })
  .refine(
    (v) =>
      (v.itemTipo === "PRODUCTO" && !!v.productoId) ||
      (v.itemTipo === "SERVICIO" && !!v.servicioId) ||
      (v.itemTipo === "PLAN" && !!v.planId),
    { message: "Seleccione un ítem.", path: ["productoId"] },
  );

const financingSchema = z
  .object({
    origenTipo: z.enum(["CLIENTE", "FINANCIADOR"]),
    financiadorId: z.string().optional(),
    monto: z.coerce.number().positive("Debe ser mayor a cero."),
  })
  .refine((v) => v.origenTipo === "CLIENTE" || !!v.financiadorId, {
    message: "Seleccione un financiador.",
    path: ["financiadorId"],
  });

const schema = z.object({
  sedeVentaId: z.string().min(1, "Seleccione una sede."),
  clienteId: z.string().min(1, "Seleccione un cliente."),
  items: z.array(itemSchema).min(1, "Agregue al menos un ítem."),
  descuentoGlobal: z.coerce.number().min(0).optional(),
  observaciones: z.string().max(500).optional().or(z.literal("")),
  financings: z.array(financingSchema).min(1),
});

type FormOutput = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

const STEPS = ["Sede y cliente", "Ítems", "Financiamiento", "Confirmación"] as const;

/** Espejo del default de `configuracion_empresa.igv_porcentaje` (docs/10) — solo para
 * la estimación en el cliente; el servidor recalcula y es la fuente autoritativa. */
const IGV_PORCENTAJE = 18;

export function SaleWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [clienteSearch, setClienteSearch] = useState("");

  const { branches } = useAuthorizedBranches();
  const productsQuery = useQuery({ queryKey: ["productos", "all"], queryFn: fetchAllProducts });
  const servicesQuery = useQuery({ queryKey: ["servicios", "all"], queryFn: fetchAllServices });
  const plansQuery = useQuery({ queryKey: ["planes", "all"], queryFn: fetchAllPlans });
  const financiadoresQuery = useQuery({ queryKey: ["financiadores", "all"], queryFn: fetchAllFinanciadores });
  const customersQuery = useQuery({
    queryKey: ["clientes", "buscar", clienteSearch],
    queryFn: () => fetchCustomers({ q: clienteSearch || undefined, pageSize: 20 }),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      sedeVentaId: "",
      clienteId: "",
      items: [{ itemTipo: "PRODUCTO", cantidad: 1 }],
      descuentoGlobal: 0,
      observaciones: "",
      financings: [{ origenTipo: "CLIENTE", monto: 0 }],
    },
  });

  const itemsArray = useFieldArray({ control, name: "items" });
  const financingsArray = useFieldArray({ control, name: "financings" });
  const watchedItems = watch("items");
  const watchedFinancings = watch("financings");
  const watchedClienteId = watch("clienteId");
  const descuentoGlobal = watch("descuentoGlobal") ?? 0;

  const priceMaps = useMemo(
    () => ({
      producto: new Map((productsQuery.data ?? []).map((p) => [p.id, { precio: Number(p.precioVenta), afectoIgv: p.afectoIgv }])),
      servicio: new Map((servicesQuery.data ?? []).map((s) => [s.id, { precio: Number(s.precioBase), afectoIgv: s.afectoIgv }])),
      plan: new Map((plansQuery.data ?? []).map((p) => [p.id, { precio: Number(p.precio), afectoIgv: p.afectoIgv }])),
    }),
    [productsQuery.data, servicesQuery.data, plansQuery.data],
  );

  function lineInfo(item: (typeof watchedItems)[number] | undefined): { subtotal: number; afectoIgv: boolean } {
    if (!item) return { subtotal: 0, afectoIgv: false };
    const id = item.itemTipo === "PRODUCTO" ? item.productoId : item.itemTipo === "SERVICIO" ? item.servicioId : item.planId;
    const map = item.itemTipo === "PRODUCTO" ? priceMaps.producto : item.itemTipo === "SERVICIO" ? priceMaps.servicio : priceMaps.plan;
    const entry = id ? map.get(id) : undefined;
    const cantidad = Number(item.cantidad) || 0;
    const descuento = Number(item.descuentoLinea) || 0;
    const subtotal = Math.max(0, cantidad * (entry?.precio ?? 0) - descuento);
    return { subtotal, afectoIgv: entry?.afectoIgv ?? false };
  }

  function lineTotal(item: (typeof watchedItems)[number] | undefined): number {
    return lineInfo(item).subtotal;
  }

  // Espejo de sales.service.ts#create: subtotal / baseImponible / igv / total.
  const lineInfos = (watchedItems ?? []).map(lineInfo);
  const itemsSubtotal = lineInfos.reduce((acc, l) => acc + l.subtotal, 0);
  const subtotalAfecto = lineInfos.reduce((acc, l) => acc + (l.afectoIgv ? l.subtotal : 0), 0);
  const baseImponible = Math.max(0, subtotalAfecto - (Number(descuentoGlobal) || 0));
  const igv = Math.round(baseImponible * (IGV_PORCENTAJE / 100) * 100) / 100;
  const estimatedTotal = Math.max(0, itemsSubtotal - (Number(descuentoGlobal) || 0) + igv);

  const selectedCliente = (customersQuery.data?.data ?? []).find((c) => c.id === watchedClienteId);
  const clienteLabel = selectedCliente
    ? [selectedCliente.nombres, selectedCliente.apellidos].filter(Boolean).join(" ")
    : "";

  const financingsSum = (watchedFinancings ?? []).reduce((acc, f) => acc + (Number(f?.monto) || 0), 0);
  const remaining = Math.round((estimatedTotal - financingsSum) * 100) / 100;

  function syncSingleClientFinancing() {
    if (watchedFinancings.length === 1 && watchedFinancings[0]?.origenTipo === "CLIENTE") {
      setValue("financings.0.monto", Math.round(estimatedTotal * 100) / 100 as never);
    }
  }

  async function goNext() {
    let fields: string[] = [];
    if (step === 0) fields = ["sedeVentaId", "clienteId"];
    if (step === 1) fields = ["items"];
    if (step === 2) fields = ["financings"];
    const valid = await trigger(fields as never);
    if (!valid) return;
    // Al entrar al paso de Financiamiento (dejar Ítems), precargar el monto
    // del financiamiento CLIENTE único con el total recién calculado.
    if (step === 1) syncSingleClientFinancing();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(values: FormOutput) {
    if (Math.abs(remaining) > 0.01) {
      setError("root", { message: "La suma de los financiamientos debe igualar el total de la venta." });
      setStep(2);
      return;
    }
    try {
      const input: SaleInput = {
        ...values,
        observaciones: values.observaciones || undefined,
      };
      const sale = await createSale(input);
      toast.success(`Venta ${sale.codigo} creada correctamente.`);
      router.push(`/ventas/${sale.id}`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo crear la venta.";
      setError("root", { message });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                i < step
                  ? "bg-brand-600 text-white"
                  : i === step
                    ? "border-2 border-brand-600 text-brand-700"
                    : "border border-neutral-300 text-neutral-500"
              }`}
            >
              {i < step ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={`text-sm ${i === step ? "font-medium text-neutral-950" : "text-neutral-500"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-neutral-300" aria-hidden />}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        {step === 0 && (
          <Card>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="sedeVentaId">Sede de venta</Label>
                <Controller
                  control={control}
                  name="sedeVentaId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="sedeVentaId" invalid={!!errors.sedeVentaId}>
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
                <FieldError id="sede-error" message={errors.sedeVentaId?.message} />
              </div>

              <div>
                <Label htmlFor="clienteSearch">Cliente</Label>
                <Controller
                  control={control}
                  name="clienteId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="clienteSearch" invalid={!!errors.clienteId}>
                        <SelectValue placeholder="Buscar cliente">{clienteLabel || undefined}</SelectValue>
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
                <FieldError id="cliente-error" message={errors.clienteId?.message} />
              </div>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-950">Ítems</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => itemsArray.append({ itemTipo: "PRODUCTO", cantidad: 1 })}
              >
                Agregar ítem
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {itemsArray.fields.map((field, index) => {
                const tipo = watchedItems?.[index]?.itemTipo ?? "PRODUCTO";
                const catalog = tipo === "PRODUCTO" ? productsQuery.data : tipo === "SERVICIO" ? servicesQuery.data : plansQuery.data;
                const fieldName = tipo === "PRODUCTO" ? "productoId" : tipo === "SERVICIO" ? "servicioId" : "planId";
                return (
                  <div key={field.id} className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-[110px_1fr_90px_110px_auto_auto]">
                    <Controller
                      control={control}
                      name={`items.${index}.itemTipo`}
                      render={({ field: f }) => (
                        <Select
                          value={f.value}
                          onValueChange={(v) => {
                            setValue(`items.${index}.productoId`, undefined);
                            setValue(`items.${index}.servicioId`, undefined);
                            setValue(`items.${index}.planId`, undefined);
                            f.onChange(v);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRODUCTO">Producto</SelectItem>
                            <SelectItem value="SERVICIO">Servicio</SelectItem>
                            <SelectItem value="PLAN">Plan</SelectItem>
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
                    <Input type="number" step="0.01" min="0" placeholder="Desc. línea" {...register(`items.${index}.descuentoLinea`)} />
                    <span className="self-center text-right text-sm tabular-nums text-neutral-700">
                      S/ {lineTotal(watchedItems?.[index]).toFixed(2)}
                    </span>
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
            <FieldError id="items-error" message={errors.items?.message} />

            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-neutral-200 pt-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="descuentoGlobal">Descuento global (opcional)</Label>
                <Input id="descuentoGlobal" type="number" step="0.01" min="0" {...register("descuentoGlobal")} />
              </div>
              <div className="flex flex-col items-end justify-end gap-0.5 text-sm">
                <div className="flex w-52 justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">S/ {itemsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex w-52 justify-between text-neutral-500">
                  <span>IGV ({IGV_PORCENTAJE}%)</span>
                  <span className="tabular-nums">S/ {igv.toFixed(2)}</span>
                </div>
                <div className="flex w-52 justify-between text-base font-semibold text-neutral-950">
                  <span>Total estimado</span>
                  <span className="tabular-nums">S/ {estimatedTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-950">Financiamiento</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => financingsArray.append({ origenTipo: "FINANCIADOR", monto: 0 })}
              >
                Agregar financiador
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {financingsArray.fields.map((field, index) => {
                const origen = watchedFinancings?.[index]?.origenTipo ?? "CLIENTE";
                return (
                  <div key={field.id} className="grid grid-cols-1 gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-[140px_1fr_140px_auto]">
                    <Controller
                      control={control}
                      name={`financings.${index}.origenTipo`}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLIENTE">Cliente</SelectItem>
                            <SelectItem value="FINANCIADOR">Institución</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {origen === "FINANCIADOR" ? (
                      <Controller
                        control={control}
                        name={`financings.${index}.financiadorId`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger invalid={!!errors.financings?.[index]?.financiadorId}>
                              <SelectValue placeholder="Seleccionar institución" />
                            </SelectTrigger>
                            <SelectContent>
                              {(financiadoresQuery.data ?? []).map((f2) => (
                                <SelectItem key={f2.id} value={f2.id}>
                                  {f2.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : (
                      <span className="self-center text-sm text-neutral-500">{clienteLabel || "Cliente de la venta"}</span>
                    )}
                    <Input type="number" step="0.01" min="0" placeholder="Monto" {...register(`financings.${index}.monto`)} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="self-center text-danger-600 hover:bg-danger-50"
                      onClick={() => financingsArray.remove(index)}
                      disabled={financingsArray.fields.length === 1}
                      aria-label="Quitar financiamiento"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col items-end gap-1 border-t border-neutral-200 pt-4 text-sm">
              <div className="flex w-64 justify-between text-neutral-700">
                <span>Total de la venta</span>
                <span className="tabular-nums">S/ {estimatedTotal.toFixed(2)}</span>
              </div>
              <div className="flex w-64 justify-between text-neutral-700">
                <span>Asignado</span>
                <span className="tabular-nums">S/ {financingsSum.toFixed(2)}</span>
              </div>
              <div className={`flex w-64 justify-between text-base font-semibold ${Math.abs(remaining) < 0.01 ? "text-success-700" : "text-danger-600"}`}>
                <span>Restante</span>
                <span className="tabular-nums">S/ {remaining.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-neutral-950">Confirmación</h2>
            <div className="mb-4">
              <Label htmlFor="observaciones">Observaciones (opcional)</Label>
              <Textarea id="observaciones" {...register("observaciones")} />
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-4 text-lg font-semibold text-neutral-950">
              <span>Total a confirmar</span>
              <span className="tabular-nums">S/ {estimatedTotal.toFixed(2)}</span>
            </div>
          </Card>
        )}

        {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

        <div className="flex justify-between">
          <Button type="button" variant="secondary" onClick={() => (step === 0 ? router.back() : setStep((s) => s - 1))}>
            {step === 0 ? "Cancelar" : "Atrás"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Continuar
            </Button>
          ) : (
            <Button type="submit" loading={isSubmitting}>
              Confirmar venta
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
