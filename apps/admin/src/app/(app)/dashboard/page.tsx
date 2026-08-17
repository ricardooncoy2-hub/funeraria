import { Banknote, PackageSearch, Receipt, Wallet } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";

export const metadata = { title: "Dashboard — Funeraria Minaya" };

/** docs/15 §15.2. Los KPIs reales llegan con el módulo de reportes (Fase 7);
 * por ahora se muestra el esqueleto sin inventar cifras. */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-950">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-700">Resumen operativo de la sede activa.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Ventas del día" icon={Receipt} value="—" hint="Disponible con el módulo de reportes" />
        <KpiCard
          label="Stock bajo"
          icon={PackageSearch}
          value="—"
          hint="Disponible con el módulo de inventario"
          tone="warning"
        />
        <KpiCard label="Cuentas por cobrar" icon={Wallet} value="—" hint="Disponible con el módulo de financiamiento" />
        <KpiCard label="Caja abierta" icon={Banknote} value="—" hint="Disponible con el módulo de caja" />
      </div>
    </div>
  );
}
