"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, changePassword, logout } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth/auth-store";
import { toast } from "@/lib/toast/toast-store";

const schema = z
  .object({
    passwordActual: z.string().min(1, "Ingrese su contraseña actual."),
    passwordNueva: z.string().min(10, "Debe tener al menos 10 caracteres."),
    confirmarPassword: z.string().min(1, "Confirme la nueva contraseña."),
  })
  .refine((data) => data.passwordNueva === data.confirmarPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmarPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const clear = useAuthStore((s) => s.clear);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  async function onSubmit(values: FormValues) {
    try {
      await changePassword(values.passwordActual, values.passwordNueva);
      await logout();
      clear();
      toast.success("Contraseña actualizada. Inicie sesión nuevamente.");
      router.replace("/login");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo cambiar la contraseña.";
      setError("root", { message });
    }
  }

  if (status !== "authenticated") return null;

  return (
    <main className="flex min-h-full items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="mb-2 text-xl font-semibold text-neutral-950">Actualice su contraseña</h1>
          <p className="mb-6 text-sm text-neutral-700">
            Por seguridad, debe establecer una nueva contraseña antes de continuar.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <div>
              <Label htmlFor="passwordActual">Contraseña actual</Label>
              <Input
                id="passwordActual"
                type="password"
                autoComplete="current-password"
                invalid={!!errors.passwordActual}
                {...register("passwordActual")}
              />
              <FieldError id="passwordActual-error" message={errors.passwordActual?.message} />
            </div>

            <div>
              <Label htmlFor="passwordNueva">Nueva contraseña</Label>
              <Input
                id="passwordNueva"
                type="password"
                autoComplete="new-password"
                invalid={!!errors.passwordNueva}
                {...register("passwordNueva")}
              />
              <FieldError id="passwordNueva-error" message={errors.passwordNueva?.message} />
            </div>

            <div>
              <Label htmlFor="confirmarPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmarPassword"
                type="password"
                autoComplete="new-password"
                invalid={!!errors.confirmarPassword}
                {...register("confirmarPassword")}
              />
              <FieldError id="confirmarPassword-error" message={errors.confirmarPassword?.message} />
            </div>

            {errors.root && <Banner variant="danger">{errors.root.message}</Banner>}

            <Button type="submit" size="lg" className="mt-2 w-full" loading={isSubmitting}>
              Guardar y continuar
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
