/**
 * Renderiza structured data (schema.org) como <script type="application/ld+json">
 * — patrón recomendado por Next.js (docs/app/guides/json-ld). Escapa `<` para
 * evitar inyección si algún valor viniera de datos del usuario/BD.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
