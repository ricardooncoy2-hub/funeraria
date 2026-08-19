"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { crearCotizacion } from "@/lib/api/cotizaciones";
import type { Plan } from "@/lib/api/planes";
import type { Sede } from "@/lib/api/sedes";

const schema = z.object({
  solicitanteNombres: z.string().trim().min(1, "Ingrese su nombre.").max(150),
  solicitanteTelefono: z.string().trim().min(1, "Ingrese un teléfono de contacto.").max(30),
  solicitanteCorreo: z.email("Correo inválido.").max(150).optional().or(z.literal("")),
  sedePreferidaId: z.string().optional().or(z.literal("")),
  planId: z.string().optional().or(z.literal("")),
  observaciones: z.string().max(1000).optional().or(z.literal("")),
  consentimientoDatos: z.boolean().refine((v) => v === true, {
    message: "Debe aceptar el consentimiento de datos personales para continuar.",
  }),
});

type FormValues = z.infer<typeof schema>;

/**
 * Formulario compartido por `/cotizacion` y `/contacto` (SKILL.md §13, §20.3).
 * No incluye selección de ítems (productos/servicios sueltos) a propósito —
 * el sitio es informativo, no un carrito; el equipo completa el detalle
 * exacto al dar seguimiento a la solicitud (estado SOLICITADA → triage).
 */
export function QuotationForm({
  sedes,
  planes,
  planIdInicial,
}: {
  sedes: Sede[];
  planes: Plan[];
  planIdInicial?: string;
}) {
  const [enviado, setEnviado] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      solicitanteNombres: "",
      solicitanteTelefono: "",
      solicitanteCorreo: "",
      sedePreferidaId: "",
      planId: planIdInicial ?? "",
      observaciones: "",
      consentimientoDatos: false,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await crearCotizacion({
        solicitanteNombres: values.solicitanteNombres,
        solicitanteTelefono: values.solicitanteTelefono,
        solicitanteCorreo: values.solicitanteCorreo || undefined,
        sedePreferidaId: values.sedePreferidaId || undefined,
        planId: values.planId || undefined,
        observaciones: values.observaciones || undefined,
        consentimientoDatos: values.consentimientoDatos,
      });
      setEnviado(true);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo enviar la solicitud. Intente nuevamente.";
      setError("root", { message });
    }
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-success-100 bg-success-50 p-8 text-center">
        <CheckCircle2 className="size-10 text-success-600" aria-hidden />
        <h2 className="text-xl font-semibold text-neutral-950">Solicitud enviada</h2>
        <p className="max-w-md text-neutral-700">
          Nos pondremos en contacto en las próximas horas. Si su consulta es urgente, puede
          escribirnos por WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div>
        <Label htmlFor="solicitanteNombres">Nombre completo *</Label>
        <Input
          id="solicitanteNombres"
          invalid={!!errors.solicitanteNombres}
          aria-describedby="solicitanteNombres-error"
          {...register("solicitanteNombres")}
        />
        <FieldError id="solicitanteNombres-error" message={errors.solicitanteNombres?.message} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="solicitanteTelefono">Teléfono *</Label>
          <Input
            id="solicitanteTelefono"
            type="tel"
            invalid={!!errors.solicitanteTelefono}
            aria-describedby="solicitanteTelefono-error"
            {...register("solicitanteTelefono")}
          />
          <FieldError id="solicitanteTelefono-error" message={errors.solicitanteTelefono?.message} />
        </div>
        <div>
          <Label htmlFor="solicitanteCorreo">Correo (opcional)</Label>
          <Input
            id="solicitanteCorreo"
            type="email"
            invalid={!!errors.solicitanteCorreo}
            aria-describedby="solicitanteCorreo-error"
            {...register("solicitanteCorreo")}
          />
          <FieldError id="solicitanteCorreo-error" message={errors.solicitanteCorreo?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="sedePreferidaId">Sede de su preferencia (opcional)</Label>
          <Controller
            control={control}
            name="sedePreferidaId"
            render={({ field }) => (
              <Select id="sedePreferidaId" {...field}>
                <option value="">Sin preferencia</option>
                {sedes.map((sede) => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="planId">Plan de interés (opcional)</Label>
          <Controller
            control={control}
            name="planId"
            render={({ field }) => (
              <Select id="planId" {...field}>
                <option value="">Aún no lo sé / prefiero que me asesoren</option>
                {planes.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="observaciones">Cuéntenos brevemente qué necesita (opcional)</Label>
        <Textarea id="observaciones" {...register("observaciones")} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 rounded border-neutral-300 text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            aria-describedby="consentimiento-error"
            {...register("consentimientoDatos")}
          />
          <span>
            Acepto el tratamiento de mis datos personales según la{" "}
            <Link href="/politica-privacidad" className="font-medium text-brand-700 hover:underline">
              Política de privacidad
            </Link>{" "}
            (Ley N.° 29733), únicamente para atender esta solicitud.
          </span>
        </label>
        <FieldError id="consentimiento-error" message={errors.consentimientoDatos?.message} />
      </div>

      {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

      <Button type="submit" size="lg" loading={isSubmitting} className="self-start">
        Enviar solicitud
      </Button>
    </form>
  );
}
