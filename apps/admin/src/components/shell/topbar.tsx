"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthorizedBranches } from "@/lib/api/use-branches";
import { logout as apiLogout } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth/auth-store";
import { useUiStore } from "@/lib/ui/ui-store";

function initials(nombres: string, apellidos: string): string {
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

function SedeSelector() {
  const { branches, isLoading } = useAuthorizedBranches();
  const activeSedeId = useAuthStore((s) => s.activeSedeId);
  const setActiveSedeId = useAuthStore((s) => s.setActiveSedeId);

  // Un usuario corporativo no tiene sedeIds propios (RB-018: acceso a todas);
  // al cargar las sedes, se preselecciona la principal como valor por defecto.
  useEffect(() => {
    if (activeSedeId || branches.length === 0) return;
    const main = branches.find((b) => b.isMain) ?? branches[0];
    setActiveSedeId(main.id);
  }, [activeSedeId, branches, setActiveSedeId]);

  if (isLoading || branches.length === 0) return null;
  // Un usuario con una sola sede autorizada no necesita elegir (SKILL.md §10.2).
  if (branches.length === 1) {
    return <span className="hidden text-sm text-neutral-700 sm:inline">{branches[0].nombre}</span>;
  }

  return (
    <Select.Root value={activeSedeId ?? undefined} onValueChange={setActiveSedeId}>
      <Select.Trigger className="flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-950 hover:bg-neutral-50">
        <Select.Value placeholder="Seleccionar sede" />
        <Select.Icon>
          <ChevronDown className="size-4 text-neutral-500" aria-hidden />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-50 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-md">
          <Select.Viewport className="p-1">
            {branches.map((b) => (
              <Select.Item
                key={b.id}
                value={b.id}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-neutral-950 outline-none data-[highlighted]:bg-neutral-100"
              >
                <Select.ItemText>{b.nombre}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="size-4 text-brand-600" aria-hidden />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const [open, setOpen] = useState(false);

  // SKILL.md §9/§16 — Esc cierra menús/modales.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!user) return null;

  async function handleLogout() {
    await apiLogout();
    clear();
    router.replace("/login");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md p-1.5 hover:bg-brand-200"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          {initials(user.nombres, user.apellidos)}
        </span>
        <span className="hidden text-sm text-neutral-950 sm:inline">{user.nombres}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-neutral-200 bg-white py-1 shadow-md"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
            >
              <LogOut className="size-4" aria-hidden />
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Topbar() {
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-brand-200 bg-brand-100 px-4">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        className="rounded-md p-2 text-neutral-700 hover:bg-brand-200 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div className="flex flex-1 items-center justify-end gap-4">
        <SedeSelector />
        <UserMenu />
      </div>
    </header>
  );
}
