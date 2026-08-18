"use client";

import { ChevronDown, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type NavGroup, type NavItem, NAV_GROUPS } from "@/lib/nav-config";
import { hasPermission, useAuthStore } from "@/lib/auth/auth-store";
import { useUiStore } from "@/lib/ui/ui-store";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  collapsed,
  active,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  if (!item.implemented) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-400",
          collapsed && "justify-center px-2",
        )}
        aria-disabled
        title={`${item.label} — próximamente`}
      >
        <Icon className="size-5 shrink-0" aria-hidden />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md border-l-[3px] border-transparent px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-brand-200",
        collapsed && "justify-center px-2",
        active && "border-brand-600 bg-brand-50 text-brand-700",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

/**
 * Un grupo del sidebar. La agrupación es solo presentación/orden — cada
 * `NavItem` ya viene filtrado por su propio permiso antes de llegar acá
 * (`SidebarContent`), así que un grupo nunca decide qué se ve, solo cómo se
 * organiza visualmente lo que ya se decidió mostrar.
 */
function NavGroupSection({
  group,
  collapsed,
  isFirst,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  collapsed: boolean;
  isFirst: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  const containsActive = group.items.some((item) => item.href === pathname);
  const manuallyCollapsed = useUiStore((s) => (group.label ? s.collapsedNavGroups[group.label] : false));
  const toggleNavGroup = useUiStore((s) => s.toggleNavGroup);

  // Separación entre bloques: en modo expandido alcanza con el margen (el
  // rótulo ya distingue un grupo del siguiente); en modo solo-íconos no hay
  // rótulo, así que se refuerza con una línea divisoria.
  const spacing = isFirst
    ? undefined
    : collapsed
      ? "mt-2 border-t border-brand-200 pt-2"
      : "mt-3";

  // Ítems sueltos (Dashboard, Reportes) o sidebar en modo solo-íconos: sin
  // encabezado ni acordeón, se listan directo (no hay espacio para rótulos
  // de grupo en 64px de ancho).
  if (!group.label || collapsed) {
    return (
      <div className={cn("flex flex-col gap-1", spacing)}>
        {group.items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={pathname === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  // La ruta activa siempre gana: un grupo colapsado nunca esconde la página
  // en la que el usuario ya está.
  const open = containsActive || !manuallyCollapsed;

  return (
    <div className={spacing}>
      <button
        type="button"
        onClick={() => toggleNavGroup(group.label as string)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold tracking-wide uppercase hover:bg-brand-200 hover:text-neutral-700",
          containsActive ? "text-brand-700" : "text-neutral-500",
        )}
        aria-expanded={open}
      >
        <span>{group.label}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform duration-150", !open && "-rotate-90")}
          aria-hidden
        />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-1">
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || hasPermission(user, item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto p-3" aria-label="Navegación principal">
      {groups.map((group, index) => (
        <NavGroupSection
          key={group.label ?? group.items[0]?.href}
          group={group}
          collapsed={collapsed}
          isFirst={index === 0}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useUiStore((s) => s.toggleSidebarCollapsed);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <>
      {/* Desktop: fija, colapsable a íconos (SKILL.md §7) */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-brand-200 bg-brand-100 transition-[width] duration-150 lg:flex print:hidden",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-14 items-center justify-center border-b border-brand-200 px-3">
          {collapsed ? (
            <span className="text-lg font-semibold text-brand-600">M</span>
          ) : (
            <Image src="/logo-minaya.png" alt="Funeraria Minaya" width={140} height={37} />
          )}
        </div>
        <SidebarContent collapsed={collapsed} onNavigate={() => {}} />
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex items-center justify-center gap-2 border-t border-brand-200 p-3 text-sm text-neutral-500 hover:bg-brand-200"
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <ChevronsRight className="size-4" aria-hidden /> : <ChevronsLeft className="size-4" aria-hidden />}
        </button>
      </aside>

      {/* Mobile: overlay a pantalla completa (SKILL.md §8) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 print:hidden lg:hidden">
          <div
            className="absolute inset-0 bg-neutral-950/50"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-brand-100 shadow-md">
            <div className="flex h-14 items-center justify-between border-b border-brand-200 px-4">
              <Image src="/logo-minaya.png" alt="Funeraria Minaya" width={140} height={37} />
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-md p-1 text-neutral-500 hover:bg-brand-200"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <SidebarContent collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
