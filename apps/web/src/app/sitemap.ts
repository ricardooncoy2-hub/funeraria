import type { MetadataRoute } from "next";
import { fetchPlanes } from "@/lib/api/planes";
import { fetchServicios } from "@/lib/api/servicios";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const RUTAS_ESTATICAS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
  { path: "/servicios", changeFrequency: "weekly", priority: 0.8 },
  { path: "/productos", changeFrequency: "weekly", priority: 0.6 },
  { path: "/planes", changeFrequency: "weekly", priority: 0.8 },
  { path: "/sedes", changeFrequency: "monthly", priority: 0.7 },
  { path: "/nosotros", changeFrequency: "yearly", priority: 0.4 },
  { path: "/contacto", changeFrequency: "yearly", priority: 0.6 },
  { path: "/cotizacion", changeFrequency: "yearly", priority: 0.6 },
  { path: "/preguntas-frecuentes", changeFrequency: "monthly", priority: 0.5 },
  { path: "/politica-privacidad", changeFrequency: "yearly", priority: 0.2 },
];

/**
 * CA-SEO-02: solo páginas públicas — el admin (`apps/admin`) es un
 * despliegue/subdominio aparte, nunca aparece acá.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [servicios, planes] = await Promise.all([fetchServicios(), fetchPlanes()]);

  const estaticas: MetadataRoute.Sitemap = RUTAS_ESTATICAS.map((ruta) => ({
    url: `${SITE_URL}${ruta.path}`,
    lastModified: new Date(),
    changeFrequency: ruta.changeFrequency,
    priority: ruta.priority,
  }));

  const serviciosDetalle: MetadataRoute.Sitemap = servicios.map((servicio) => ({
    url: `${SITE_URL}/servicios/${servicio.codigo}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const planesDetalle: MetadataRoute.Sitemap = planes.map((plan) => ({
    url: `${SITE_URL}/planes/${plan.codigo}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...estaticas, ...serviciosDetalle, ...planesDetalle];
}
