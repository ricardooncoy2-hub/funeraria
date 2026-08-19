import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * CA-SEO-02: el panel admin (`apps/admin`) es un despliegue aparte
 * (`app.funeraria-minaya.pe`) con su propio `robots:{index:false}` en
 * `apps/admin/src/app/layout.tsx` — no depende de este archivo, que solo
 * controla el dominio del sitio público.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
