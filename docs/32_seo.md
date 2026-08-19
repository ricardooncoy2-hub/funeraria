# 32 — SEO (Sitio Público)

## 32.1 Objetivo

Posicionar a Funeraria Minaya en búsquedas locales (Áncash y provincias donde opera) para servicios funerarios, planes y productos, con buena experiencia móvil y performance.

## 32.2 Renderizado y performance

- **SSG/ISR** (Next.js) para páginas de contenido → HTML pre-renderizado indexable y rápido.
- Optimización de imágenes (`next/image`, formatos modernos, lazy load).
- Fuentes con `next/font` (sin bloqueo).
- Code splitting; minimizar JS del cliente en páginas de contenido.
- **Core Web Vitals objetivo:** LCP < 2.5 s, CLS < 0.1, INP bajo (RNF-003).
- Caché de CDN (Cloudflare) para estáticos.

## 32.3 Metadatos

- `generateMetadata` por página: `title`, `description`, canonical, Open Graph y Twitter Card.
- Títulos y descripciones únicos por servicio/plan/sede.
- `lang="es-PE"`.

## 32.4 Datos estructurados (JSON-LD)

- `LocalBusiness` / `FuneralHome` con nombre, dirección, teléfono, horario, zonas de servicio, geo.
- Una entrada por **sede** (con su dirección y teléfono) para SEO local.
- `Service` para servicios funerarios; `FAQPage` para la sección de preguntas frecuentes; `BreadcrumbList` para navegación.

## 32.5 Arquitectura de URLs

- URLs limpias y descriptivas: `/servicios/velatorio`, `/planes/plan-basico`, `/sedes/caraz`.
- Slugs estables; evitar parámetros innecesarios.

> **Decisión Fase 7:** no se implementó un slug legible como columna nueva del
> modelo de datos. `Producto`/`Servicio`/`Plan`/`Sede` solo tenían un `codigo`
> interno (`SRV-001`, `PLN-001`) sin formato de slug. El sitio es
> estrictamente informativo y de contacto directo (cotización/WhatsApp), no
> un e-commerce — no justificaba una migración de schema solo para SEO. Se
> usa el `codigo` interno directo en la URL (`/servicios/SRV-001`,
> `/planes/PLN-001`), estable por construcción (no depende de que alguien no
> edite un nombre). `Producto` no tiene página de detalle propia (se consulta
> agrupado por categoría en `/productos` o dentro de los planes que lo
> incluyen); `Sede` tampoco (toda la información va inline en `/sedes`, sin
> obligar a navegar a otra pantalla — SKILL.md §20.3). Implementación en
> `apps/web/src/app/servicios/[codigo]/page.tsx` y
> `apps/web/src/app/planes/[codigo]/page.tsx`.

## 32.6 Sitemap y robots

- `sitemap.xml` generado (incluye páginas de servicios, planes, sedes, FAQ).
- `robots.txt`: permite el sitio público; **bloquea** el subdominio `app` (admin) y rutas privadas.
- El admin (`app.`) marcado `noindex, nofollow`.

## 32.7 SEO local

- Página por sede con dirección, teléfono, mapa (embed), horarios y zona de cobertura.
- Consistencia NAP (Nombre, Dirección, Teléfono) en todo el sitio.
- Recomendación de negocio: perfil de Google Business por sede (fuera del software, pero coherente con las páginas de sede).

## 32.8 Accesibilidad ↔ SEO

- Encabezados jerárquicos (`h1` único por página), textos alternativos en imágenes, contraste AA, navegación por teclado. Mejora accesibilidad y también SEO.

## 32.9 Contenido

- Textos claros y sensibles al contexto (servicios funerarios) — tono respetuoso.
- FAQ orientada a dudas reales (trámites, planes, cobertura, contacto), útil para búsquedas long-tail.

## 32.10 Medición

- Integrar analítica respetuosa de privacidad (p. ej. Plausible o GA con consentimiento) — con aviso de cookies conforme a Ley 29733 si se usan cookies de terceros.
- Search Console para monitorear indexación y consultas.

## 32.11 Criterios de aceptación

- **CA-SEO-01:** cada página pública tiene title/description únicos y canonical.
- **CA-SEO-02:** el admin no es indexable; el sitemap solo incluye páginas públicas.
- **CA-SEO-03:** cada sede tiene JSON-LD `LocalBusiness` con NAP correcto.
