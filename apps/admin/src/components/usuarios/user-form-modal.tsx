"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import { type User, type UserInput, createUser, updateUser } from "@/lib/api/users";
import { useAuthStore } from "@/lib/auth/auth-store";
import { toast } from "@/lib/toast/toast-store";

const baseSchema = {
  nombres: z.string().trim().min(1, "Ingrese los nombres.").max(150),
  apellidos: z.string().trim().min(1, "Ingrese los apellidos.").max(150),
  correo: z.email("Correo inválido.").max(150),
  usuario: z.string().trim().min(1, "Ingrese un usuario.").max(60),
  telefono: z.string().max(30).optional().or(z.literal("")),
  esCorporativo: z.boolean(),
};

const createSchema = z.object({
  ...baseSchema,
  password: z.string().min(10, "Debe tener al menos 10 caracteres."),
});
const editSchema = z.object(baseSchema);

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

export function UserFormModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = editar; ausente = crear. */
  user?: User;
  onSuccess: () => void;
}) {
  const currentUser = useAuthStore((s) => s.user);
  const schema = user ? editSchema : createSchema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({ resolver: zodResolver(schema) as never });

  useEffect(() => {
    if (!open) return;
    reset({
      nombres: user?.nombres ?? "",
      apellidos: user?.apellidos ?? "",
      correo: user?.correo ?? "",
      usuario: user?.usuario ?? "",
      telefono: user?.telefono ?? "",
      esCorporativo: user?.esCorporativo ?? false,
      password: "",
    });
  }, [open, user, reset]);

  const esCorporativo = watch("esCorporativo");

  async function onSubmit(values: CreateValues | EditValues) {
    try {
      const input: UserInput = {
        nombres: values.nombres,
        apellidos: values.apellidos,
        correo: values.correo,
        usuario: values.usuario,
        telefono: values.telefono || undefined,
        esCorporativo: values.esCorporativo,
      };
      if (user) {
        await updateUser(user.id, input);
        toast.success(`${values.nombres} se actualizó correctamente.`);
      } else {
        await createUser({ ...input, password: (values as CreateValues).password });
        toast.success(`${values.nombres} se creó correctamente.`);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el usuario.";
      setError("root", { message });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={user ? "Editar usuario" : "Nuevo usuario"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="nombres">Nombres</Label>
            <Input id="nombres" invalid={!!errors.nombres} {...register("nombres")} />
            <FieldError id="nombres-error" message={errors.nombres?.message} />
          </div>
          <div>
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input id="apellidos" invalid={!!errors.apellidos} {...register("apellidos")} />
            <FieldError id="apellidos-error" message={errors.apellidos?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="usuario">Usuario</Label>
            <Input id="usuario" invalid={!!errors.usuario} {...register("usuario")} />
            <FieldError id="usuario-error" message={errors.usuario?.message} />
          </div>
          <div>
            <Label htmlFor="correo">Correo</Label>
            <Input id="correo" type="email" invalid={!!errors.correo} {...register("correo")} />
            <FieldError id="correo-error" message={errors.correo?.message} />
          </div>
        </div>

        {!user && (
          <div>
            <Label htmlFor="password">Contraseña inicial</Label>
            <Input id="password" type="password" invalid={!!errors.password} {...register("password")} />
            <FieldError id="password-error" message={(errors as typeof errors & { password?: { message?: string } }).password?.message} />
            <p className="mt-1.5 text-xs text-neutral-500">
              El usuario deberá cambiarla al iniciar sesión por primera vez.
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="telefono">Teléfono (opcional)</Label>
          <Input id="telefono" {...register("telefono")} />
        </div>

        {currentUser?.isCorporate && (
          <div className="flex items-center justify-between rounded-md border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-950">Acceso corporativo</p>
              <p className="text-xs text-neutral-500">Acceso a todas las sedes, sin asignación individual.</p>
            </div>
            <Switch checked={esCorporativo} onCheckedChange={(v) => setValue("esCorporativo", v)} />
          </div>
        )}

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
