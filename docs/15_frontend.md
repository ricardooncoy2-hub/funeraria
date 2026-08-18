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
- Barra lateral con ítems agrupados por proceso de negocio (ver tabla de grupos abajo), topbar con selector de sede y usuario, breadcrumbs.
- Los ítems de menú se muestran/ocultan según permisos del usuario, **cada uno de forma individual** (defensa en UX; la seguridad real está en backend).
- **La agrupación del sidebar es puramente de presentación y orden** (facilitar el escaneo visual), no un control de acceso: no existe permiso a nivel de grupo. Un grupo se pinta si al menos uno de sus ítems pasó el filtro de permisos de su propio ítem; nunca oculta ni expone nada por sí mismo. Los grupos se muestran como secciones plegables tipo acordeón (expandidas por defecto — "reducir pasos, no ocultarlos"); si la ruta activa cae dentro de un grupo colapsado manualmente, ese grupo se fuerza a abierto para no esconder la página en la que está el usuario. Implementación: `apps/admin/src/lib/nav-config.ts` (`NAV_GROUPS`) y `apps/admin/src/components/shell/sidebar.tsx`.

### Módulos/pantallas

| Grupo (sidebar) | Sección | Pantallas |
|---|---|---|
| *(suelto, sin grupo)* | Dashboard | KPIs por sede: ventas del día, stock bajo, CxC, caja abierta |
| Ventas | Clientes | CRUD, historial |
| Ventas | Cotizaciones | Bandeja, asignación, conversión a venta |
| Ventas | Ventas | Nueva venta (wizard), listado, estado de cuenta, anulación |
| Ventas | Servicios | Servicios, disponibilidad y precio por sede |
| Ventas | Planes | Planes y componentes |
| Finanzas | Financiamiento | Financiadores, coberturas, estados |
| Finanzas | Cuentas por cobrar | Saldos por financiador, antigüedad |
| Finanzas | Pagos | Registro de pagos (efectivo/electrónico), anulación |
| Finanzas | Caja | Apertura, movimientos, cierre/arqueo |
| Compras e inventario | Proveedores | CRUD |
| Compras e inventario | Compras | Registro, recepción, detalle |
| Compras e inventario | Inventario | Stock por sede, kardex, ajustes, stock bajo |
| Compras e inventario | Transferencias | Solicitud, aprobación, envío, recepción |
| Compras e inventario | Productos | Catálogo, categorías |
| Administración | Sedes | Lista, alta/edición, marcar principal |
| Administración | Usuarios y roles | Usuarios, asignación de sedes/roles, roles y permisos |
| Administración | Auditoría | Consulta de eventos |
| *(suelto, sin grupo)* | Reportes | Por sede y consolidados, exportación |

> **Nota sobre la agrupación:** Productos convive con Inventario (no con Servicios/Planes) porque es el único de los tres con seguimiento real de stock (kardex, ajustes, transferencias); Servicios y Planes no se stockean, por eso quedan con el resto del flujo de venta. Dashboard y Reportes quedan sueltos porque su audiencia de permisos (todos los roles autenticados / `reportes.sede`, respectivamente) no coincide con la de ningún otro grupo — forzarlos a compartir encabezado con otro ítem generaría un rótulo que no describe lo que ese rol realmente ve ahí.

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
