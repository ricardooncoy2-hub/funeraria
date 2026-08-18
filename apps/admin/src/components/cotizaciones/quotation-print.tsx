import { PrintDocument, PrintFields, PrintSection } from "@/components/print/print-document";
import type { QuotationDetail } from "@/lib/api/quotations";

export function QuotationPrint({ quotation }: { quotation: QuotationDetail }) {
  return (
    <PrintDocument
      title="Cotización"
      code={quotation.codigo}
      fecha={new Date(quotation.fecha).toLocaleDateString("es-PE")}
      sede={quotation.sedeAsignada?.nombre ?? quotation.sedePreferida?.nombre ?? undefined}
      disclaimer="Documento informativo generado por el sistema — no constituye comprobante de pago tributario. Precios referenciales, sujetos a confirmación."
    >
      <PrintSection title="Solicitante">
        <PrintFields
          fields={[
            { label: "Nombre", value: quotation.solicitanteNombres },
            { label: "Teléfono", value: quotation.solicitanteTelefono },
            { label: "Correo", value: quotation.solicitanteCorreo || "—" },
            {
              label: "Cliente vinculado",
              value: quotation.cliente
                ? [quotation.cliente.nombres, quotation.cliente.apellidos].filter(Boolean).join(" ")
                : "Sin vincular",
            },
            {
              label: "Válido hasta",
              value: quotation.validoHasta ? new Date(quotation.validoHasta).toLocaleDateString("es-PE") : "—",
            },
          ]}
        />
      </PrintSection>

      <PrintSection title={quotation.plan ? "Plan" : "Ítems"}>
        {quotation.plan ? (
          <p className="font-medium text-neutral-950">{quotation.plan.nombre}</p>
        ) : quotation.items.length === 0 ? (
          <p className="text-neutral-500">Sin ítems registrados.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-400 text-left">
                <th className="px-2 py-1.5 font-medium text-neutral-700">Descripción</th>
                <th className="px-2 py-1.5 text-right font-medium text-neutral-700">Cantidad</th>
                <th className="px-2 py-1.5 text-right font-medium text-neutral-700">Precio referencial</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-200">
                  <td className="px-2 py-1.5 text-neutral-950">{item.producto?.nombre ?? item.servicio?.nombre}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{item.cantidad}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {item.precioReferencial ? `S/ ${Number(item.precioReferencial).toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PrintSection>

      {quotation.observaciones && (
        <PrintSection title="Observaciones">
          <p className="text-neutral-700">{quotation.observaciones}</p>
        </PrintSection>
      )}
    </PrintDocument>
  );
}
