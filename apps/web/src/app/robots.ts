import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

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
