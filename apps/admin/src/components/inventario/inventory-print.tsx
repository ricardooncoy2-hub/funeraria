import { PrintDocument, PrintSection } from "@/components/print/print-document";
import type { InventoryRow } from "@/lib/api/inventory";

export function InventoryPrint({
  rows,
  sedeNombre,
  vista,
}: {
  rows: InventoryRow[];
  /** `undefined` = todas las sedes autorizadas del usuario. */
  sedeNombre?: string;
  vista: "todo" | "bajo";
}) {
  const bajoCount = rows.filter((r) => Number(r.stockActual) <= Number(r.stockMinimo)).length;

  return (
    <PrintDocument
      title="Reporte de inventario"
      code={vista === "bajo" ? "Vista: stock bajo" : "Vista: todo el stock"}
      fecha={new Date().toLocaleDateString("es-PE")}
      sede={sedeNombre ?? "Todas las sedes autorizadas"}
    >
      <PrintSection title={`Stock (${rows.length} productos${vista === "todo" ? `, ${bajoCount} en stock bajo` : ""})`}>
        {rows.length === 0 ? (
          <p className="text-neutral-500">Sin registros para este filtro.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-400 text-left">
                <th className="px-2 py-1.5 font-medium text-neutral-700">Producto</th>
                <th className="px-2 py-1.5 font-medium text-neutral-700">Sede</th>
                <th className="px-2 py-1.5 text-right font-medium text-neutral-700">Stock actual</th>
                <th className="px-2 py-1.5 text-right font-medium text-neutral-700">Stock mínimo</th>
                <th className="px-2 py-1.5 text-right font-medium text-neutral-700">Costo promedio</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const bajo = Number(row.stockActual) <= Number(row.stockMinimo);
                return (
                  <tr key={row.id} className="break-inside-avoid border-b border-neutral-200">
                    <td className="px-2 py-1.5 text-neutral-950">{row.producto.nombre}</td>
                    <td className="px-2 py-1.5 text-neutral-700">{row.branch.nombre}</td>
                    <td className={`px-2 py-1.5 text-right tabular-nums ${bajo ? "font-semibold text-warning-700" : ""}`}>
                      {row.stockActual}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{row.stockMinimo}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">S/ {Number(row.costoPromedio).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </PrintSection>
    </PrintDocument>
  );
}
