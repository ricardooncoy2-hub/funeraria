"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, login } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth/auth-store";

const loginSchema = z.object({
  usuario: z.string().trim().min(1, "Ingrese su usuario o correo."),
  password: z.string().min(1, "Ingrese su contraseña."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await login(values.usuario, values.password);
      setSession(result.accessToken, result.user);
      router.replace(result.user.mustChangePassword ? "/cambiar-password" : "/dashboard");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo iniciar sesión. Intente nuevamente.";
      setError("root", { message });
    }
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/logo-minaya.png" alt="Funeraria Minaya" width={240} height={64} priority />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="mb-6 text-xl font-semibold text-neutral-950">Iniciar sesión</h1>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <div>
              <Label htmlFor="usuario">Usuario o correo</Label>
              <Input
                id="usuario"
                autoComplete="username"
                invalid={!!errors.usuario}
                aria-describedby={errors.usuario ? "usuario-error" : undefined}
                {...register("usuario")}
              />
              <FieldError id="usuario-error" message={errors.usuario?.message} />
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              <FieldError id="password-error" message={errors.password?.message} />
            </div>

            {errors.root && (
              <p role="alert" className="text-sm text-danger-600">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-2 w-full" loading={isSubmitting}>
              Ingresar
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
