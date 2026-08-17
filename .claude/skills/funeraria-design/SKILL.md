---
name: funeraria-design
description: Use whenever building, reviewing, or modifying UI for the Funeraria Minaya frontends (apps/web público, apps/admin) — pages, layouts, components, forms, tables, dashboards, cards, modals, alerts, navigation, or anything touching visual design (color, type, spacing, icons). Defines the complete UI/UX design system — visual identity derived from the company logo, color palette, typography, spacing/grid, responsive rules, accessibility, component specs, and per-context guidance for the public site vs. the admin panel. Load before writing any Tailwind classes, choosing colors/fonts, or laying out a screen in either app.
---

# Funeraria Minaya — Sistema de Diseño UI/UX

Guía de diseño reutilizable para las dos aplicaciones Next.js del proyecto (`apps/web` público y `apps/admin`). Es un complemento **visual/UX** de [`docs/15_frontend.md`](../../../docs/15_frontend.md), que sigue siendo la fuente de verdad **funcional** (rutas, pantallas, módulos, librerías). Esta skill no repite esa estructura; la viste.

**Regla de consistencia (CLAUDE.md §8):** si en algún momento esta skill y `docs/15_frontend.md` entran en conflicto sobre tokens, tipografía o componentes, no se debe adivinar — hay que unificarlos actualizando `docs/15_frontend.md` (o registrando la diferencia ahí) antes de seguir implementando.

Valores listos para copiar a `tailwind.config`/`globals.css` (paleta completa en HSL, escala tipográfica, espaciado, sombras, radios): [`references/tokens.md`](references/tokens.md).

## 0. Contexto del sistema

Origen de esta guía: análisis de `docs/15_frontend.md` (dos apps Next.js + Tailwind, sitio público SSG/ISR sin auth, admin SPA autenticada con RBAC/multi-sede) y del logotipo oficial (`apps/admin/public/logo-minaya.png`).

Perfil de los usuarios reales del sistema (no diseñadores de UI, no siempre expertos en tecnología):
- **Público general** (web pública): familias en un momento de duelo, buscando información, confianza y una forma rápida de contactar o cotizar. Cero tolerancia a fricción o confusión.
- **Personal operativo** (admin: vendedores, encargados de caja/inventario): usan el sistema muchas veces al día, bajo presión de tiempo. Priorizan velocidad y claridad sobre estética.
- **Administradores/supervisores** (admin): necesitan panoramas (dashboards, reportes) claros y confiables.

Esto determina el tono de todo lo que sigue: **sobriedad, claridad y eficiencia por encima de la ornamentación.**

## 1. Principios de diseño

1. **Serenidad antes que efecto.** Nada de animaciones llamativas, gradientes agresivos, colores saturados grandes o carruseles automáticos. El diseño debe transmitir calma, no energía ni urgencia comercial.
2. **Confianza por claridad, no por decoración.** La confianza se construye con jerarquía clara, información correcta, estados de carga honestos y ausencia de callejones sin salida — no con insignias, iconos de "garantía" o texto en mayúsculas.
3. **Mobile-first, siempre.** Se diseña primero para el celular (la mayoría del tráfico público llega desde ahí, a menudo en movimiento o con señal débil) y se expande hacia tablet/escritorio. Nunca al revés.
4. **Reducir pasos, no ocultarlos.** UX orientada a completar tareas frecuentes (registrar una venta, un pago, abrir caja) en el menor número de clics/pantallas posible, sin esconder información crítica para lograrlo.
5. **Un solo acento de color.** El azul de marca (§3) es el único color que se usa para llamar la atención (acciones primarias, enlaces, foco). Todo lo demás vive en la escala de grises + colores semánticos reservados exclusivamente para estado (§18).
6. **Consistencia por encima de creatividad local.** Un mismo componente (botón, tabla, card, badge de estado) se ve y comporta igual en toda la aplicación y entre `apps/web` y `apps/admin`, salvo las diferencias de contexto descritas en §20–21.
7. **Todo estado es visible.** Ninguna acción se queda "muda": todo fetch, envío de formulario o mutación tiene estados de carga/éxito/error explícitos (§18).

## 2. Identidad visual

### 2.1 Logotipo
Fuente: `apps/admin/public/logo-minaya.png`. Composición: wordmark "Minaya" en script cursivo azul + "FUNERARIA" en sans-serif negro sobre él, una curva/swoosh azul, y una cruz azul con sombra. Fondo transparente/blanco.

Reglas de uso:
- **Espacio de resguardo:** dejar un margen libre alrededor del logo equivalente como mínimo a la altura de la letra "F" de "FUNERARIA". No colocar texto, bordes o imágenes dentro de ese margen.
- **Tamaño mínimo:** 120px de ancho en pantalla (proporcional). Por debajo de eso, usar solo el isotipo de la cruz o el nombre en texto plano (ver logo simplificado, §2.2).
- **Fondos permitidos:** blanco o gris muy claro (`neutral-50`/`neutral-100`, ver §3.2). Sobre fondos oscuros o de color, usar la variante en blanco/monocromática si existe; si no existe, no colocar el logo sobre esos fondos — usar el nombre en texto.
- **Prohibido:** estirar/deformar, rotar, recolorear el azul, aplicar sombras o efectos adicionales, colocarlo sobre fotografías sin una superficie de contraste sólida detrás.
- **Favicon/isotipo:** derivar del elemento de la cruz únicamente (sin el texto), recortado a un cuadrado con el mismo azul de marca.

### 2.2 Logo simplificado (topbar admin, espacios reducidos)
En el topbar del admin y otros espacios de altura limitada (~32–40px), usar wordmark de texto: **"Minaya"** en `font-semibold`, azul de marca, sin el script cursivo del logo (que no es legible a tamaños pequeños ni accesible como texto real). El logo completo en PNG se reserva para: login, footer del sitio público, header del sitio público, documentos/PDFs exportados.

### 2.3 Tono de marca transmitido en UI
Confianza · Respeto · Serenidad · Profesionalismo · Cercanía · Calidad de servicio. Esto se traduce en reglas concretas:
- Copys en trato formal pero cálido ("Cuéntenos cómo podemos ayudarlo", no "¡Hazlo ya!").
- Sin lenguaje de urgencia/venta agresiva ("¡Últimas plazas!", contadores regresivos) en ningún punto del sitio público.
- Fotografía (si se usa) siempre serena: naturaleza, velas, manos, arquitectura de las sedes — nunca imágenes explícitas relacionadas al fallecimiento.

## 3. Paleta de colores

Metodología: una sola familia de marca (azul del logo) definida en HSL con matiz fijo y variaciones sistemáticas de saturación/luminosidad, más una escala neutra y colores semánticos de estado. Valores completos y listos para copiar en [`references/tokens.md`](references/tokens.md#colores).

### 3.1 Azul de marca ("Azul Minaya")
Extraído del logotipo (azul ultramar saturado). Matiz de referencia: **H 241°**. Es el **único** color de acento del sistema.

| Token | HSL | Uso |
|---|---|---|
| `brand-600` (base) | `hsl(241 70% 33%)` ≈ `#1c1a8a` | Acciones primarias, enlaces, foco, elementos de marca |
| `brand-700` | `hsl(241 72% 26%)` | Hover/active de botones primarios |
| `brand-50` | `hsl(241 60% 97%)` | Fondos sutiles (banners, selección, hover de filas) |
| `brand-100` | `hsl(241 55% 92%)` | Bordes/fondos de badges "info" de marca |

> Si en algún momento se obtiene el hex exacto de marca (guía de marca formal, Pantone), reemplazar aquí y en `references/tokens.md` — es el único lugar que debe actualizarse.

### 3.2 Escala neutra (texto, fondos, bordes)
Gris frío (mismo matiz ~241° con saturación mínima) para que combine con el azul sin generar dos temperaturas de color distintas.

| Token | Uso |
|---|---|
| `neutral-950` | Texto principal (nunca negro puro `#000`) |
| `neutral-700` | Texto secundario |
| `neutral-500` | Texto deshabilitado, placeholders |
| `neutral-300` | Bordes de inputs/cards |
| `neutral-200` | Bordes sutiles, separadores |
| `neutral-100` | Fondos alternos (filas de tabla pares, secciones) |
| `neutral-50` | Fondo de página (admin) |
| `white` | Fondo de cards, inputs, fondo de página (público) |

### 3.3 Colores semánticos (solo para estado, nunca decorativos)

| Semántico | Color | Uso |
|---|---|---|
| `success` | Verde `hsl(142 60% 32%)` | Confirmado, pagado, aprobado, completado |
| `warning` | Ámbar `hsl(38 85% 45%)` | Pendiente, en revisión, stock bajo, requiere atención |
| `danger` | Rojo `hsl(0 65% 45%)` | Anulado, rechazado, error, saldo negativo, eliminar |
| `info` | Celeste `hsl(205 70% 42%)` | Información neutral, en proceso, notificaciones informativas |
| `neutral` (estado) | Gris `neutral-500` | Cancelado, cerrado, inactivo — algo terminado sin connotación positiva/negativa |

**Regla dura:** `danger` se usa exclusivamente para errores/anulaciones/acciones destructivas — nunca para simplemente "llamar la atención" sobre algo. `brand-600` nunca se usa para comunicar estado (no confundir "es de marca" con "está aprobado").

### 3.4 Mapeo de estados de negocio → color semántico
Regla concreta, no ambigua, para todos los badges de estado que aparecen en el sistema (`docs/06_reglas_negocio.md`, `docs/21_financiamiento.md`, `docs/22_pagos_cajas.md`):

| Estado | Semántico |
|---|---|
| `CONFIRMADA`, `CONFIRMADO`, `APROBADA`, `PAGADA`, `ABIERTA`, `RECIBIDA` | `success` |
| `PENDIENTE`, `BORRADOR`, `DOCUMENTADA`, `ENVIADA`, `OBSERVADA`, `PARCIALMENTE_PAGADA`, `EN_TRANSITO`, `stock bajo` | `warning` |
| `ANULADA`, `ANULADO`, `RECHAZADA`, error de validación | `danger` |
| `CANCELADA`, `CERRADA`, `INACTIVO` | `neutral` (estado) |
| Notificación puramente informativa (p. ej. "sede sin acceso total") | `info` |

### 3.5 Contraste (ver también §9)
Todo par texto/fondo debe cumplir **WCAG AA** (4.5:1 texto normal, 3:1 texto grande/ícono). `brand-600` sobre blanco y blanco sobre `brand-600` cumplen AA — verificar siempre que se introduzca una combinación nueva.

## 4. Tipografía

- **Familia única para UI y texto:** una sans-serif humanista y muy legible en pantalla — **Inter** (o `system-ui` como fallback inmediato si no se auto-hospeda). Se usa en el 100% de la interfaz: navegación, formularios, tablas, dashboards, cuerpo del sitio público.
- **No usar una tipografía script/cursiva en la UI**, ni siquiera para evocar el logo — es ilegible a tamaños de interfaz y rompe accesibilidad. El único lugar donde aparece el trazo cursivo del logo es el PNG del logotipo en sí.
- **Acento tipográfico permitido (solo sitio público, con moderación):** una serif editorial (p. ej. **Lora** o **Fraunchen**) reservada exclusivamente para titulares grandes (`h1` del hero, títulos de sección) en la web pública, para dar un tono cálido/editorial sin sacrificar legibilidad. **Nunca** en el admin, nunca en párrafos, nunca en botones/inputs.
- **Pesos:** usar como máximo 3 pesos por familia (regular 400, medium 500, semibold 600). Evitar `bold` 700 salvo para `h1` puntual — el peso excesivo generalizado se ve "gritado", lo opuesto al tono de marca.
- **Numerales:** usar `tabular-nums` en toda cifra monetaria, cantidad o fecha dentro de tablas para que las columnas alineen verticalmente.

## 5. Escala tipográfica

Escala modular (~1.25), base 16px, mobile-first (mismos tokens en ambas apps; tamaños de `h1`/`h2` se reducen en admin porque el espacio es más denso — ver tabla).

| Token | Tamaño | Line-height | Uso |
|---|---|---|---|
| `text-xs` | 12px | 16px | Metadatos, ayudas de formulario, timestamps |
| `text-sm` | 14px | 20px | Texto secundario, celdas de tabla, labels |
| `text-base` | 16px | 24px | Cuerpo de texto (mínimo legible, nunca ir más chico) |
| `text-lg` | 18px | 28px | Texto destacado, subtítulos de card |
| `text-xl` | 20px | 28px | `h4`, títulos de card/modal |
| `text-2xl` | 24px | 32px | `h3`, títulos de sección (admin) |
| `text-3xl` | 30px | 38px | `h2` |
| `text-4xl` | 36px | 44px | `h1` (admin, páginas internas) |
| `text-5xl`/`text-6xl` | 48px/60px | 1.1 | `h1` hero (solo sitio público, con la serif de acento en desktop) |

Valores exactos y `font-family` en [`references/tokens.md`](references/tokens.md#tipografía).

## 6. Espaciado

Escala base 4px (múltiplos de 4, escala estándar de Tailwind: `1`=4px … `4`=16px … `8`=32px …). Reglas de aplicación:

- **Padding interno de componentes:** inputs/botones `12px 16px` (`py-3 px-4`); cards `16px` en mobile, `24px` en desktop.
- **Espaciado entre elementos relacionados** (label→input, ícono→texto): `8px`.
- **Espaciado entre campos de un formulario:** `16px`–`24px`.
- **Espaciado entre secciones** (bloques temáticos de una página): `48px`–`64px` en desktop, `32px` en mobile.
- **Nunca** usar valores arbitrarios fuera de la escala (nada de `padding: 13px`, `margin: 22px`).

## 7. Grid y layout

- **Sitio público:** contenedor centrado, `max-width: 1200px`, padding lateral `16px` (mobile) / `24px` (tablet) / `32px` (desktop, dentro del `max-width`). Grid de 12 columnas en desktop; 4 en mobile; 8 en tablet.
- **Admin:** layout de aplicación de tres zonas fijas — sidebar (colapsable, 240px expandida / 64px colapsada a solo íconos), topbar (56px alto, fijo), área de contenido con `max-width: 1440px` y padding `24px` (`16px` en mobile). El contenido nunca ocupa el ancho completo de pantallas ultra-anchas: se centra con margen lateral neutro.
- **Formularios largos** (wizard de venta, alta de usuario): una sola columna en mobile; máximo 2 columnas en desktop, nunca 3+ (dificulta el escaneo vertical).
- **Tablas de datos:** ocupan el 100% del ancho disponible del contenedor de contenido.

## 8. Responsive design (mobile-first)

Breakpoints (estándar Tailwind, no se personalizan):

| Breakpoint | Ancho | Contexto |
|---|---|---|
| (base) | 0–639px | Mobile |
| `sm` | 640px | Mobile grande / phablet |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop pequeño (admin: sidebar pasa de overlay a fija) |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Desktop grande |

Reglas:
- Todo componente se construye primero en su versión mobile (`base`), luego se agregan variantes `md:`/`lg:` para expandir — nunca al revés.
- **Objetivo táctil mínimo:** 44×44px para cualquier elemento interactivo (botón, ítem de menú, checkbox) en viewports táctiles.
- **Tablas en mobile (admin):** por debajo de `md`, las tablas de datos NO hacen scroll horizontal como única solución — se transforman en una lista de "cards" apiladas, una por fila, mostrando las columnas como pares label/valor. El scroll horizontal de tabla es aceptable solo como respaldo en tablas con muchas columnas numéricas (p. ej. kardex).
- **Sidebar admin en mobile:** oculta por defecto, se abre como overlay a pantalla completa sobre un botón de menú (hamburguesa) en el topbar; se cierra al navegar o tocar fuera.
- **Sitio público:** el CTA principal (cotización/WhatsApp) siempre visible sin scroll en mobile (botón flotante, ver §11 y `WhatsAppButton` en `docs/15_frontend.md`).

## 9. Accesibilidad

No negociable — la web pública sirve a un público general, muchas veces en un momento de estrés, y el admin debe ser usable por personal con distintos niveles de destreza tecnológica.

- **Contraste:** mínimo AA (4.5:1 texto normal, 3:1 texto grande ≥18px/24px bold y para íconos funcionales). Ver paleta validada en §3.5.
- **Foco visible siempre:** ningún elemento interactivo suprime el `outline` de foco (`focus-visible`) sin reemplazarlo por un anillo equivalente en `brand-600` con offset de 2px. Nunca `outline: none` sin sustituto.
- **Navegación por teclado completa:** todo flujo (incluido el wizard de venta y los modales) debe poder completarse solo con teclado — `Tab`/`Shift+Tab` en orden lógico, `Enter`/`Space` activan, `Esc` cierra modales/menús.
- **Roles y labels ARIA:** todo input tiene `<label>` asociado (nunca solo `placeholder` como label). Iconos usados como único contenido de un botón llevan `aria-label`. Modales usan `role="dialog"` + `aria-modal="true"` + foco atrapado dentro.
- **Texto alternativo:** toda imagen de contenido (fotos de sedes, productos) lleva `alt` descriptivo; imágenes puramente decorativas usan `alt=""`.
- **Movimiento reducido:** toda animación/transición respeta `prefers-reduced-motion: reduce` (se desactivan o se reducen a un fade instantáneo).
- **Tamaño de texto:** nunca fijar tamaños en `px` que impidan el zoom del navegador; usar unidades relativas (`rem`) para tipografía.
- **Formularios:** errores de validación asociados al campo vía `aria-describedby`, no solo por color (siempre acompañados de ícono + texto, ver §18).

## 10. Navegación

### 10.1 Sitio público
Header fijo simple: logo a la izquierda, enlaces principales al centro/derecha (Inicio, Servicios, Productos, Planes, Sedes, Nosotros, Contacto), botón de contacto/WhatsApp destacado a la derecha. En mobile colapsa a menú hamburguesa a pantalla completa. Footer con enlaces secundarios (FAQ, sedes, datos de contacto, aviso de privacidad Ley 29733), sin recargar de enlaces.

### 10.2 Admin
Estructura exacta según `docs/15_frontend.md` §15.2:
- **Sidebar** con ítems agrupados por módulo (Dashboard, Sedes, Usuarios y roles, Productos/Servicios/Planes, Proveedores, Compras, Inventario, Transferencias, Clientes, Cotizaciones, Ventas, Financiamiento, Cuentas por cobrar, Pagos, Caja, Reportes, Auditoría). **Los ítems se muestran u ocultan según los permisos del usuario** — nunca se muestra un ítem que llevará a un 403 (defensa en UX, la seguridad real vive en backend).
- **Topbar** fijo: wordmark simplificado (§2.2) a la izquierda, selector de sede activa al centro/derecha (obligatorio si el usuario tiene más de una sede autorizada), menú de usuario (avatar/iniciales + nombre + logout) a la derecha.
- **Breadcrumbs** en toda pantalla a más de un nivel de profundidad (p. ej. Ventas → Nueva venta).
- **Estado activo:** el ítem de sidebar correspondiente a la ruta actual se resalta con fondo `brand-50` + texto `brand-700` + borde izquierdo `brand-600` de 3px.

### 10.3 Reglas comunes
- Nunca más de 2 niveles de anidamiento en cualquier menú (ni sidebar ni dropdown).
- Todo enlace/ítem de navegación tiene un estado `hover` y un estado `active`/`current` visualmente distintos.

## 11. Iconografía

- **Librería:** `lucide-react` (coherente con el stack shadcn/ui sugerido en `docs/15_frontend.md`, tree-shakeable, trazo consistente).
- **Estilo:** trazo (`stroke`), nunca relleno sólido, `stroke-width` 1.5–2px consistente en toda la app.
- **Tamaños:** 16px (inline con texto `text-sm`), 20px (botones/inputs estándar), 24px (títulos, estados vacíos destacados). No usar tamaños intermedios.
- **Color:** hereda `currentColor` — nunca un color fijo hardcodeado; así los íconos dentro de un botón `danger` se ven rojos automáticamente, etc.
- **Uso:** solo como refuerzo de una etiqueta de texto, nunca como único medio de comunicar una acción crítica (salvo con `aria-label`, ver §9). Evitar decorar con íconos elementos que no lo necesitan (no todo `<li>` de una lista necesita un ícono).

## 12. Botones y acciones

Jerarquía de 4 niveles, consistente en ambas apps:

| Variante | Uso | Estilo |
|---|---|---|
| `primary` | Una sola por vista/sección — la acción principal (Guardar, Confirmar venta, Registrar pago) | Fondo `brand-600`, texto blanco, `hover:brand-700` |
| `secondary` | Acciones alternativas de igual jerarquía visual pero no principales (Cancelar, Volver) | Borde `neutral-300`, texto `neutral-950`, fondo blanco, `hover:neutral-50` |
| `ghost` | Acciones de baja fricción dentro de tablas/cards (Ver, Editar) | Sin fondo ni borde, texto `neutral-700`, `hover:neutral-100` |
| `destructive` | Anular, eliminar, cancelar de forma irreversible | Fondo `danger`, texto blanco — **siempre** exige confirmación en modal (§16) antes de ejecutarse |

Reglas:
- **Un solo botón `primary` visible por vista.** Si hay dos acciones igualmente importantes, ninguna es `primary` (usar dos `secondary`) o se re-piensa el flujo.
- Tamaños: `sm` (32px alto, tablas/toolbars), `md` (40px alto, formularios — por defecto), `lg` (48px alto, CTAs del sitio público).
- Todo botón que dispara una petición async muestra estado de carga (spinner + se deshabilita) y **nunca permite doble envío** (§18).
- Texto de botón siempre es un verbo de acción claro ("Guardar cambios", no "OK"; "Registrar pago", no "Enviar").
- Iconos en botones van antes del texto, 20px, mismo color que el texto/fondo del botón.

## 13. Formularios

- **Un campo por línea en mobile**, máximo 2 columnas en desktop (§7), agrupados en secciones lógicas con un título de sección si el formulario supera ~6 campos (p. ej. wizard de venta, alta de usuario).
- **Labels siempre visibles encima del input** (no floating labels, no solo placeholder) — más legible y accesible.
- **Validación:** inline, al perder el foco del campo (`onBlur`) y al enviar — nunca solo al enviar (frustra en formularios largos). Mensaje de error específico y accionable ("El DNI debe tener 8 dígitos", no "Campo inválido"), en `danger`, con ícono, debajo del campo.
- **Campos obligatorios** marcados con `*` junto al label; si la mayoría de campos son obligatorios, marcar en cambio los opcionales con "(opcional)".
- **Montos:** input alineado a la derecha, `tabular-nums`, prefijo "S/" fijo fuera del campo editable, 2 decimales.
- **Selects de catálogo largo** (producto, cliente): combobox con búsqueda (no un `<select>` nativo con cientos de opciones).
- **Wizard de venta** (`docs/15_frontend.md` §15.2, flujo destacado): stepper horizontal visible en desktop (numerado, con el paso activo resaltado en `brand-600`) que colapsa a un indicador de progreso simple ("Paso 2 de 5") en mobile. Se puede retroceder a un paso anterior sin perder los datos ya ingresados.
- **Autoguardado no crítico:** en formularios largos, evitar que un error de red destruya lo ya llenado (mantener el estado del formulario en memoria hasta confirmación exitosa).
- **Botón de envío deshabilitado** solo cuando el formulario es inválido de forma objetiva (campos vacíos obligatorios); nunca deshabilitarlo de forma que el usuario no entienda por qué no puede continuar sin un mensaje visible.

## 14. Tablas

Base: TanStack Table (`docs/15_frontend.md`), estilo consistente en todo el admin.

- **Encabezado** `neutral-100` de fondo, texto `text-sm font-medium neutral-700`, sticky al hacer scroll vertical en tablas largas.
- **Filas:** alternar `white`/`neutral-50` (zebra sutil) solo si la tabla tiene muchas columnas numéricas (kardex, movimientos de caja); en tablas simples, filas blancas con separador `neutral-200` de 1px es suficiente.
- **Hover de fila:** `neutral-100`, cursor pointer si la fila es clickeable (navega al detalle).
- **Números y montos:** alineados a la derecha, `tabular-nums`. Texto alineado a la izquierda. Estados (badges) centrados.
- **Acciones por fila:** al final, como botones `ghost` o un menú `⋯` si son más de 2 acciones — nunca más de 3 acciones visibles por fila sin agrupar en menú.
- **Paginación:** siempre server-side para tablas potencialmente grandes (ventas, movimientos, auditoría); controles al pie, con tamaño de página configurable (20 por defecto, según `docs/14_api.md`).
- **Ordenamiento:** clic en encabezado, indicador de flecha, un solo criterio de orden a la vez salvo que se pida explícitamente multi-orden.
- **Densidad:** compacta por defecto en tablas operativas (inventario, movimientos) — `py-2` en celdas; cómoda (`py-3`) en tablas de gestión (usuarios, sedes).
- **Estados** (vacío/carga/error): ver §18.

## 15. Cards

- **Cards de catálogo público** (`ServiceCard`, `PlanCard`, `ProductCard`, `BranchCard` de `docs/15_frontend.md`): imagen o ícono arriba, título `text-lg font-semibold`, descripción corta `text-sm neutral-700` (máx. 2–3 líneas, truncada con ellipsis), precio si aplica en `brand-700 font-semibold`, un solo CTA al pie. Borde `neutral-200` 1px + `shadow-sm`, `hover:shadow-md` con transición suave (§19).
- **Cards de dashboard (KPI)**: etiqueta pequeña arriba (`text-sm neutral-700`), valor grande abajo (`text-3xl font-semibold`), variación/contexto opcional en `text-xs`. Un ícono de 24px alineado a la etiqueta, coloreado según si el KPI es neutro o de alerta (p. ej. "Stock bajo" en `warning`).
- **Radio:** `rounded-lg` (8px) en todas las cards, consistente con inputs y botones (§ tokens).
- **Sombra:** nunca más que `shadow-md`; el sistema es sobrio, no "flotante". Sin sombras de color.

## 16. Modales

- Se usan para: confirmaciones destructivas (anular venta/pago, cerrar caja), formularios cortos que no ameritan una página propia (crear categoría rápida), y el arqueo de cierre de caja.
- **Nunca** para formularios largos de múltiples pasos (eso es una página o un wizard inline, §13) ni para mostrar contenido de solo lectura extenso (eso es una página de detalle).
- Ancho máximo `480px` (confirmaciones) o `640px` (formularios cortos); siempre centrado, con overlay `neutral-950/50` detrás.
- Estructura fija: título (`text-xl font-semibold`), cuerpo, footer con acciones alineadas a la derecha — `secondary` (Cancelar) a la izquierda del par, acción principal (`primary` o `destructive` según el caso) a la derecha, en ese orden.
- **Confirmaciones destructivas** (anular, cerrar caja, eliminar) explican la consecuencia en una frase ("Esta venta pasará a estado ANULADA y no podrá revertirse") y, si la acción es especialmente sensible, exigen un motivo en un textarea antes de habilitar el botón de confirmar (coherente con `anulado_motivo` en el modelo de datos).
- Cierre: botón `×` arriba a la derecha, tecla `Esc`, clic en el overlay — los tres deben funcionar salvo que el modal tenga cambios sin guardar (entonces confirmar antes de cerrar).
- Foco atrapado dentro del modal mientras está abierto (§9).

## 17. Alertas y notificaciones

Dos mecanismos distintos, no intercambiables:

- **Toast (notificación flotante, temporal):** para confirmar el resultado de una acción puntual del usuario (pago registrado, venta creada, error de red). Esquina superior derecha en desktop, parte superior a ancho completo en mobile. Auto-descarta a los 4–6s (errores pueden requerir descarte manual). Un ícono + color por semántico (§3.3): `success`/`danger`/`warning`/`info`.
- **Banner (persistente, dentro del layout):** para condiciones de estado que persisten mientras dure la sesión o la vista (p. ej. "No tiene una caja abierta en esta sede", "Esta venta está anulada"). Se ubica en la parte superior del contenido de la página, no flota ni se auto-descarta.
- Nunca usar `alert()`/`confirm()` nativos del navegador.
- Nunca apilar más de 3 toasts simultáneos (los adicionales reemplazan/agrupan).

## 18. Estados de componentes

Todo componente que depende de datos remotos implementa explícitamente estos cuatro estados — nunca dejar una pantalla en blanco mientras carga ni un error silencioso:

| Estado | Regla |
|---|---|
| **Loading** | Skeleton (bloques grises pulsantes con la forma aproximada del contenido final) para cargas de página/tabla; spinner pequeño solo dentro de botones o componentes chicos. Nunca un spinner de página completa salvo en la carga inicial de la app. |
| **Empty** | Ícono outline 32–40px en `neutral-300`, mensaje breve explicando por qué está vacío ("Aún no hay ventas registradas en esta sede"), y si aplica un CTA para la acción que resolvería el vacío ("Registrar primera venta"). Nunca solo una tabla sin filas y sin explicación. |
| **Error** | Mensaje en lenguaje humano usando `error.message` del formato uniforme de error de la API (`docs/14_api.md` §14.3) cuando exista, con acción de reintentar si aplica. Nunca mostrar el stack técnico ni el código HTTP crudo al usuario. |
| **Success** | Confirmación explícita (toast o cambio de estado visible en la UI) tras cada mutación — el usuario nunca debe preguntarse "¿esto se guardó?". |

**Doble envío:** todo botón que dispara una mutación se deshabilita inmediatamente al hacer clic (antes de esperar la respuesta) para impedir envíos duplicados — crítico en pagos y ventas.

**Badges de estado de negocio:** pastilla (`rounded-full`, `px-2.5 py-0.5`, `text-xs font-medium`), fondo en el tono `-100` del semántico correspondiente (§3.4) y texto en el tono `-700`, nunca fondo sólido saturado con texto blanco (demasiado fuerte para una etiqueta que aparece decenas de veces por tabla).

## 19. Microinteracciones

Mínimas y funcionales — refuerzan que algo respondió, nunca decoran porque sí.

- **Duración:** 150ms (hover/foco de elementos pequeños), 200ms (aparición de dropdowns/tooltips), 250ms (modales, paneles laterales). Nunca más de 300ms — se siente lento, no elegante.
- **Easing:** `ease-out` para elementos que aparecen/entran, `ease-in` para los que desaparecen/salen.
- **Qué anima:** opacidad y transform (`translate`/`scale`) — nunca `width`/`height`/`top`/`left` (causan repintado costoso y se ven "saltones").
- **Qué NO anima:** cambios de texto/números en tablas o KPIs (aparecen instantáneos, no hacen "count-up"); no hay parallax, ni auto-play de ningún tipo, ni confeti/celebraciones tras completar una venta (tono sobrio, no gamificado).
- Respeta siempre `prefers-reduced-motion` (§9).

## 20. Web pública — lineamientos específicos

- **Objetivo:** SEO + conversión a cotización/WhatsApp (`docs/15_frontend.md` §15.1), no un catálogo de e-commerce. El diseño prioriza claridad informativa y un camino corto hacia el contacto.
- **Hero de inicio:** titular en la serif de acento (§4) + subtítulo en Inter + un único CTA primario (Cotizar) y uno secundario (WhatsApp/Contacto). Sin video de fondo, sin autoplay.
- **`WhatsAppButton`:** flotante, esquina inferior derecha, ícono + (opcional) texto "Escríbenos" en desktop, mensaje prellenado. Debe respetar el espacio seguro inferior en mobile (no tapar el CTA principal ni un footer sticky si existiera).
- **`QuotationForm`:** el formulario más importante del sitio — sigue todas las reglas de §13, más: casilla de consentimiento de datos personales (Ley 29733) obligatoria y explícita, nunca premarcada; mensaje de éxito claro tras el envío indicando el siguiente paso ("Nos pondremos en contacto en las próximas horas").
- **SEO:** cada página define `generateMetadata` con título/descripción únicos; JSON-LD `LocalBusiness`/`FuneralService` en las páginas relevantes; imágenes con `alt` real y dimensiones explícitas (evitar CLS); textos con jerarquía semántica correcta (`h1` único por página, `h2` para secciones).
- **Contenido sensible:** nunca mostrar precios de forma que se sienta transaccional/fría sin contexto humano cerca (acompañar con un CTA de "hablar con nosotros", no solo un botón "Comprar").
- **Sedes:** cada `BranchCard`/página de sede muestra dirección, teléfono y mapa — información práctica que alguien busca en un momento urgente, sin obligarlo a navegar varias pantallas.

## 21. Panel administrativo — lineamientos específicos

- **Objetivo:** velocidad y precisión operativa para usuarios frecuentes, no primera impresión. Densidad de información más alta que el sitio público es aceptable y deseable.
- **Selector de sede activa:** siempre visible en el topbar si el usuario tiene más de una sede autorizada; cambiarlo refresca el contexto de toda la vista actual sin perder la ubicación de navegación.
- **Dashboard** (`docs/15_frontend.md` §15.2): grid de KPI cards (§15) arriba — ventas del día, stock bajo, CxC, caja abierta — seguido de accesos directos a las tareas más frecuentes según el rol del usuario. Ningún gráfico decorativo sin valor accionable; los gráficos que sí existan (Recharts) usan la paleta semántica de §3, nunca colores arbitrarios.
- **Formularios operativos frecuentes** (registrar pago, abrir caja) deben poder completarse en una sola pantalla/modal, sin navegación adicional, cuando el flujo lo permite.
- **Tablas** son la superficie principal de casi todos los módulos (§14) — priorizar filtros rápidos (por sede, estado, fecha) siempre visibles arriba de la tabla, no escondidos en un panel colapsado.
- **Feedback de operaciones críticas** (venta, pago, cierre de caja): siempre una confirmación explícita post-acción con los datos clave del resultado (p. ej. tras cerrar caja: saldo esperado, contado y diferencia visibles inmediatamente, no solo un toast genérico de "Guardado").
- **Modo oscuro:** no requerido para v1 (no está en el alcance de `docs/15_frontend.md`); si se solicita en el futuro, se define como ADR aparte antes de implementarse.

## 22. Reglas de uso (hacer)

- Usar siempre los tokens de `references/tokens.md` — nunca un valor de color/espaciado/tamaño escrito a mano fuera de la escala.
- Un único botón `primary` por vista.
- Todo estado de negocio se muestra con el badge y color semántico mapeado en §3.4 — nunca inventar un color nuevo para un estado nuevo sin agregarlo primero a esa tabla.
- Mobile-first en cada componente nuevo.
- Loading/empty/error/success explícitos en todo lo que dependa de datos remotos.
- Confirmación explícita antes de cualquier acción destructiva o irreversible.
- Mantener el mismo componente de botón/input/tabla/card en `apps/admin` y `apps/web` (mismo código compartido si el monorepo lo permite) salvo las diferencias de §20–21.

## 23. Reglas a evitar (no hacer)

- No usar gradientes, sombras de color, glassmorphism ni efectos "de moda" ajenos al tono sobrio de la marca.
- No usar más de un color de acento (`brand-600`) en una misma vista para elementos no relacionados.
- No usar rojo/verde saturados a pantalla completa (fondos de banner de error/éxito) — reservar el semántico saturado para acentos pequeños (íconos, bordes, badges), con fondos siempre en el tono `-50`/`-100`.
- No usar `alert()`/`confirm()` nativos.
- No usar tipografía script/cursiva fuera del logotipo.
- No animar `width`/`height`/`top`/`left`; no usar animaciones de más de 300ms; nada de autoplay, parallax o confeti.
- No colocar más de un CTA `primary` por vista, ni más de 3 acciones sin agrupar por fila de tabla.
- No mostrar tablas vacías sin explicación, ni pantallas en blanco mientras cargan.
- No mostrar errores técnicos crudos (stack traces, códigos HTTP) al usuario final.
- No deformar, recolorear ni rotar el logotipo.
- No introducir dependencias de UI pesadas (librerías de animación grandes, icon packs adicionales) sin justificarlo — mantener la simplicidad que pide `CLAUDE.md` para un sistema de PYME.

## Referencias

- [`references/tokens.md`](references/tokens.md) — valores exactos (HSL, `rem`, sombras, radios) listos para `tailwind.config`/`globals.css`.
- [`docs/15_frontend.md`](../../../docs/15_frontend.md) — estructura funcional de ambas apps (fuente de verdad).
- [`docs/06_reglas_negocio.md`](../../../docs/06_reglas_negocio.md), [`docs/21_financiamiento.md`](../../../docs/21_financiamiento.md), [`docs/22_pagos_cajas.md`](../../../docs/22_pagos_cajas.md) — origen de los estados de negocio mapeados en §3.4.
