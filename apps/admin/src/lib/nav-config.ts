import {
  ArrowLeftRight,
  Banknote,
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  type LucideIcon,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserSquare2,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permiso requerido para mostrar el ítem. `null` = visible para cualquier usuario autenticado. */
  permission: string | null;
  /** Fase que construye la pantalla real. Mientras sea false, el ítem se muestra deshabilitado. */
  implemented: boolean;
}

export interface NavGroup {
  /**
   * `null` = ítem suelto sin encabezado de grupo (Dashboard, Reportes): no
   * comparte audiencia de permisos con ningún otro ítem del menú, así que
   * agruparlo forzosamente solo generaría un encabezado engañoso para los
   * roles que no calzan con el resto del grupo.
   */
  label: string | null;
  items: NavItem[];
}

/**
 * Estructura de navegación del admin — docs/15_frontend.md §15.2. La
 * agrupación (`NAV_GROUPS`) es puramente de presentación y orden, para que
 * el menú sea más fácil de escanear; **no** es un control de acceso — cada
 * `NavItem.permission` se sigue evaluando de forma individual, igual que
 * antes de introducir los grupos. Un grupo nunca oculta un ítem que el
 * usuario sí tendría permiso de ver, ni muestra uno que no tendría.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null, implemented: true }],
  },
  {
    label: "Ventas",
    items: [
      { label: "Clientes", href: "/clientes", icon: UserSquare2, permission: "ventas.crear", implemented: true },
      { label: "Cotizaciones", href: "/cotizaciones", icon: FileText, permission: "cotizaciones.gestionar", implemented: true },
      { label: "Ventas", href: "/ventas", icon: Receipt, permission: "ventas.crear", implemented: true },
      { label: "Servicios", href: "/servicios", icon: HeartHandshake, permission: "catalogo.leer", implemented: true },
      { label: "Planes", href: "/planes", icon: ClipboardList, permission: "catalogo.leer", implemented: true },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { label: "Financiamiento", href: "/financiamiento", icon: Landmark, permission: "financiamiento.gestionar", implemented: true },
      { label: "Cuentas por cobrar", href: "/cuentas-por-cobrar", icon: Wallet, permission: "financiamiento.gestionar", implemented: true },
      { label: "Pagos", href: "/pagos", icon: CreditCard, permission: "pagos.registrar", implemented: true },
      { label: "Caja", href: "/caja", icon: Banknote, permission: "caja.operar", implemented: true },
    ],
  },
  {
    label: "Compras e inventario",
    items: [
      { label: "Proveedores", href: "/proveedores", icon: Truck, permission: "compras.gestionar", implemented: true },
      { label: "Compras", href: "/compras", icon: ShoppingCart, permission: "compras.gestionar", implemented: true },
      { label: "Inventario", href: "/inventario", icon: Warehouse, permission: "inventario.leer", implemented: true },
      { label: "Transferencias", href: "/transferencias", icon: ArrowLeftRight, permission: "transferencias.solicitar", implemented: true },
      { label: "Productos", href: "/productos", icon: Package, permission: "catalogo.leer", implemented: true },
    ],
  },
  {
    label: "Administración",
    items: [
      { label: "Sedes", href: "/sedes", icon: Building2, permission: "sedes.gestionar", implemented: true },
      { label: "Usuarios y roles", href: "/usuarios", icon: Users, permission: "usuarios.gestionar", implemented: true },
      { label: "Auditoría", href: "/auditoria", icon: ShieldCheck, permission: "auditoria.leer", implemented: false },
    ],
  },
  {
    label: null,
    items: [{ label: "Reportes", href: "/reportes", icon: BarChart3, permission: "reportes.sede", implemented: false }],
  },
];

/** Lista plana de todos los ítems, derivada de `NAV_GROUPS` — para casos que no necesitan la agrupación. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);
