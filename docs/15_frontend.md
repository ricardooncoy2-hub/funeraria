# 15 — Frontend

Dos aplicaciones Next.js (App Router) + React + TypeScript + Tailwind CSS, lógicamente independientes, consumiendo la misma API.

## 15.1 Sitio público (`www.funeraria-minaya.pe`)

### Objetivos
SEO, mobile-first, performance y accesibilidad (ver [32](32_seo.md) y RNF-003/061).

### Renderizado
- **SSG/ISR** para páginas de contenido (inicio, nosotros, servicios, productos, planes, sedes, FAQ), revalidación incremental (`revalidate`) para reflejar cambios de catálogo sin rebuild.
- **SSR** o Server Actions para el formulario de cotización (validación server-side + rate limit).

### Páginas / rutas
| Ruta | Contenido |
|---|---|
| `/` | Inicio: propuesta, servicios destacados, planes, CTA cotización/WhatsApp |
| `/nosotros` | Historia, valores, cobertura |
| `/servicios` | Lista de servicios (desde `/public/servicios`) |
| `/servicios/[slug]` | Detalle de servicio |
| `/productos` | Catálogo público (ataúdes, urnas, etc.) |
| `/planes` | Planes/paquetes |
| `/promociones` | Promociones vigentes |
| `/sedes` | Sedes con dirección, teléfono, mapa |
| `/contacto` | Formulario + WhatsApp + datos |
| `/preguntas-frecuentes` | FAQ |
| `/cotizacion` | Formulario de solicitud de cotización |

### Componentes clave
- `WhatsAppButton` (flotante) con mensaje prellenado y número configurable.
- `QuotationForm` con validación (Zod), consentimiento de datos (Ley 29733), captcha, envío a `/public/cotizaciones`.
- `ServiceCard`, `PlanCard`, `ProductCard`, `BranchCard`.
- SEO: `generateMetadata`, JSON-LD (`LocalBusiness`, `FuneralService`), sitemap y robots.

### Estado y datos
- Sin autenticación. Datos vía `fetch` server-side con cache/revalidate. No expone endpoints internos.

## 15.2 Frontend administrativo (`app.funeraria-minaya.pe`)

### Renderizado
- SPA autenticada (App Router con client components para vistas interactivas; SSR para el shell). Sin indexación (noindex).

### Autenticación en el cliente
- Login → guarda access token en memoria y refresh token en **cookie httpOnly** (mitiga XSS). Renovación silenciosa vía `/auth/refresh`.
- Guardado de sesión y `me` (roles + sedes) en un store (Zustand o React Context). El **selector de sede activa** filtra vistas según sedes autorizadas.

### Layout
- Barra lateral por módulos (según permisos), topbar con selector de sede y usuario, breadcrumbs.
- Los ítems de menú se muestran/ocultan según permisos del usuario (defensa en UX; la seguridad real está en backend).

### Módulos/pantallas
| Sección | Pantallas |
|---|---|
| Dashboard | KPIs por sede: ventas del día, stock bajo, CxC, caja abierta |
| Sedes | Lista, alta/edición, marcar principal |
| Usuarios y roles | Usuarios, asignación de sedes/roles, roles y permisos |
| Productos | Catálogo, categorías |
| Servicios | Servicios, disponibilidad y precio por sede |
| Planes | Planes y componentes |
| Proveedores | CRUD |
| Compras | Registro, recepción, detalle |
| Inventario | Stock por sede, kardex, ajustes, stock bajo |
| Transferencias | Solicitud, aprobación, envío, recepción |
| Clientes | CRUD, historial |
| Cotizaciones | Bandeja, asignación, conversión a venta |
| Ventas | Nueva venta (wizard), listado, estado de cuenta, anulación |
| Financiamiento | Financiadores, coberturas, estados |
| Cuentas por cobrar | Saldos por financiador, antigüedad |
| Pagos | Registro de pagos (efectivo/electrónico), anulación |
| Caja | Apertura, movimientos, cierre/arqueo |
| Reportes | Por sede y consolidados, exportación |
| Auditoría | Consulta de eventos |

### Flujo destacado: wizard de venta
1. Sede de venta (según acceso) + cliente.
2. Ítems (productos con validación de stock de la sede, servicios, plan).
3. Descuentos e impuestos (cálculo en vivo).
4. Financiamiento: distribuir el total entre cliente e instituciones (validación Σ = total).
5. Confirmación → crea venta. Opcional: registrar pago inicial y/o servicio contratado.

### Librerías sugeridas (admin)
- Formularios: React Hook Form + Zod.
- Datos remotos: TanStack Query (cache, reintentos, invalidación).
- Tablas: TanStack Table.
- Gráficos (dashboard/reportes): Recharts.
- UI: componentes propios con Tailwind (o shadcn/ui).

## 15.3 Compartición de código

- Cliente de API tipado generado desde `openapi.json` (o un paquete `@minaya/api-client` en el monorepo).
- Tipos de dominio compartidos en `packages/shared` (ver [57 del prompt / estructura del proyecto]).

## 15.4 Accesibilidad y i18n

- Español (Perú); textos centralizados para futura i18n.
- Navegación por teclado, roles ARIA, foco visible, contraste AA.
- Formatos: fecha `DD/MM/AAAA`, moneda `S/ #,##0.00`, zona horaria America/Lima.
