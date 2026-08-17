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

/**
 * Estructura de navegación del admin — docs/15_frontend.md §15.2. El mapeo
 * de cada sección a un permiso es una decisión de UX (defensa visual, no de
 * seguridad: el backend es la única fuente real de autorización, RB-018).
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null, implemented: true },
  { label: "Sedes", href: "/sedes", icon: Building2, permission: "sedes.gestionar", implemented: true },
  { label: "Usuarios y roles", href: "/usuarios", icon: Users, permission: "usuarios.gestionar", implemented: true },
  { label: "Productos", href: "/productos", icon: Package, permission: "catalogo.leer", implemented: true },
  { label: "Servicios", href: "/servicios", icon: HeartHandshake, permission: "catalogo.leer", implemented: true },
  { label: "Planes", href: "/planes", icon: ClipboardList, permission: "catalogo.leer", implemented: true },
  { label: "Proveedores", href: "/proveedores", icon: Truck, permission: "compras.gestionar", implemented: true },
  { label: "Compras", href: "/compras", icon: ShoppingCart, permission: "compras.gestionar", implemented: false },
  { label: "Inventario", href: "/inventario", icon: Warehouse, permission: "inventario.leer", implemented: false },
  { label: "Transferencias", href: "/transferencias", icon: ArrowLeftRight, permission: "transferencias.solicitar", implemented: false },
  { label: "Clientes", href: "/clientes", icon: UserSquare2, permission: "ventas.crear", implemented: false },
  { label: "Cotizaciones", href: "/cotizaciones", icon: FileText, permission: "cotizaciones.gestionar", implemented: false },
  { label: "Ventas", href: "/ventas", icon: Receipt, permission: "ventas.crear", implemented: false },
  { label: "Financiamiento", href: "/financiamiento", icon: Landmark, permission: "financiamiento.gestionar", implemented: false },
  { label: "Cuentas por cobrar", href: "/cuentas-por-cobrar", icon: Wallet, permission: "financiamiento.gestionar", implemented: false },
  { label: "Pagos", href: "/pagos", icon: CreditCard, permission: "pagos.registrar", implemented: false },
  { label: "Caja", href: "/caja", icon: Banknote, permission: "caja.operar", implemented: false },
  { label: "Reportes", href: "/reportes", icon: BarChart3, permission: "reportes.sede", implemented: false },
  { label: "Auditoría", href: "/auditoria", icon: ShieldCheck, permission: "auditoria.leer", implemented: false },
];
