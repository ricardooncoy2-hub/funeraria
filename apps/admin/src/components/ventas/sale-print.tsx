import { PrintDocument, PrintFields, PrintSection } from "@/components/print/print-document";
import type { EstadoCuenta, SaleDetail } from "@/lib/api/sales";

export function SalePrint({ sale, cuenta }: { sale: SaleDetail; cuenta: EstadoCuenta | undefined }) {
  return (
    <PrintDocument
      title="Comprobante interno de venta"
      code={sale.codigo}
      fecha={new Date(sale.fecha).toLocaleDateString("es-PE")}
      sede={sale.sedeVenta.nombre}
      disclaimer="Documento interno generado por el sistema — no constituye comprobante de pago tributario (boleta/factura electrónica)."
    >
      <PrintFields
        fields={[
          {
            label: "Cliente",
            value: `${sale.cliente.nombres} ${sale.cliente.apellidos ?? ""} — ${sale.cliente.numeroDocumento}`,
          },
          { label: "Vendedor", value: `${sale.vendedor.nombres} ${sale.vendedor.apellidos}` },
          { label: "Estado", value: sale.estado },
        ]}
      />

      <PrintSection title="Ítems">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-400 text-left">
              <th className="px-2 py-1.5 font-medium text-neutral-700">Descripción</th>
              <th className="px-2 py-1.5 text-right font-medium text-neutral-700">Cantidad</th>
              <th className="px-2 py-1.5 text-right font-medium text-neutral-700">Precio unit.</th>
              <th className="px-2 py-1.5 text-right font-medium text-neutral-700">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-200">
                <td className="px-2 py-1.5 text-neutral-950">{item.descripcion}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{item.cantidad}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">S/ {Number(item.precioUnitario).toFixed(2)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">S/ {Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex flex-col items-end gap-1 border-t border-neutral-300 pt-3">
          <div className="flex w-56 justify-between text-neutral-700">
            <span>Subtotal</span>
            <span className="tabular-nums">S/ {Number(sale.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex w-56 justify-between text-neutral-700">
            <span>Descuento</span>
            <span className="tabular-nums">S/ {Number(sale.descuento).toFixed(2)}</span>
          </div>
          <div className="flex w-56 justify-between text-neutral-700">
            <span>IGV</span>
            <span className="tabular-nums">S/ {Number(sale.igv).toFixed(2)}</span>
          </div>
          <div className="flex w-56 justify-between text-base font-semibold text-neutral-950">
            <span>Total</span>
            <span className="tabular-nums">S/ {Number(sale.total).toFixed(2)}</span>
          </div>
        </div>
      </PrintSection>

      {cuenta && (
        <PrintSection title="Estado de cuenta">
          <PrintFields
            fields={[
              { label: "Total", value: `S/ ${Number(cuenta.total).toFixed(2)}` },
              { label: "Financiado", value: `S/ ${Number(cuenta.financiado).toFixed(2)}` },
              { label: "Cobrado", value: `S/ ${Number(cuenta.cobrado).toFixed(2)}` },
              { label: "Por cobrar", value: `S/ ${Number(cuenta.porCobrar).toFixed(2)}` },
            ]}
          />
        </PrintSection>
      )}

      <PrintSection title="Financiamiento">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-400 text-left">
              <th className="px-2 py-1.5 font-medium text-neutral-700">Origen</th>
              <th className="px-2 py-1.5 text-right font-medium text-neutral-700">Monto</th>
              <th className="px-2 py-1.5 text-left font-medium text-neutral-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            {sale.financings.map((f) => (
              <tr key={f.id} className="border-b border-neutral-200">
                <td className="px-2 py-1.5 text-neutral-950">
                  {f.origenTipo === "CLIENTE" ? "Cliente" : (f.financiador?.nombre ?? "Institución")}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">S/ {Number(f.monto).toFixed(2)}</td>
                <td className="px-2 py-1.5 text-neutral-700">{f.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PrintSection>

      <PrintSection title="Pagos">
        {sale.payments.length === 0 ? (
          <p className="text-neutral-500">Aún no hay pagos registrados.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-400 text-left">
                <th className="px-2 py-1.5 font-medium text-neutral-700">Fecha</th>
                <th className="px-2 py-1.5 text-right font-medium text-neutral-700">Monto</th>
                <th className="px-2 py-1.5 text-left font-medium text-neutral-700">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sale.payments.map((p) => (
                <tr key={p.id} className="border-b border-neutral-200">
                  <td className="px-2 py-1.5 text-neutral-700">{new Date(p.fecha).toLocaleDateString("es-PE")}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">S/ {Number(p.monto).toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-neutral-700">{p.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintSection>
    </PrintDocument>
  );
}
