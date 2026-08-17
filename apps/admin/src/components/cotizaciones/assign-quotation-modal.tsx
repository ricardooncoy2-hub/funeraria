"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { asignarQuotation } from "@/lib/api/quotations";
import { useAuthorizedBranches } from "@/lib/api/use-branches";
import { toast } from "@/lib/toast/toast-store";

const schema = z.object({
  sedeAsignadaId: z.string().min(1, "Seleccione una sede."),
});

type FormValues = z.infer<typeof schema>;

export function AssignQuotationModal({
  open,
  onOpenChange,
  quotationId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  onSuccess: () => void;
}) {
  const { branches } = useAuthorizedBranches();
  const {
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { sedeAsignadaId: "" } });

  async function onSubmit(values: FormValues) {
    try {
      await asignarQuotation(quotationId, values.sedeAsignadaId);
      toast.success("Cotización asignada correctamente.");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo asignar la cotización.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Asignar a sede" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <Label htmlFor="sedeAsignadaId">Sede</Label>
          <Controller
            control={control}
            name="sedeAsignadaId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="sedeAsignadaId" invalid={!!errors.sedeAsignadaId}>
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
          <FieldError id="sede-error" message={errors.sedeAsignadaId?.message} />
        </div>

        {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Asignar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
