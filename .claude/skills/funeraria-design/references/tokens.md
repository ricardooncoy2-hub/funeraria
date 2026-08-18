# Tokens de diseño — Funeraria Minaya

Valores implementables, derivados de las reglas en [`../SKILL.md`](../SKILL.md). Copiar directamente a `tailwind.config.ts` (o al bloque `@theme` de Tailwind v4) y a `globals.css` como variables CSS. Si se obtiene una guía de marca formal con hex exactos, actualizar únicamente este archivo — todo lo demás referencia estos tokens por nombre.

## Colores

Definidos en HSL con matiz de marca fijo (**240°**, índigo del logotipo) para que toda la escala azul y neutra comparta temperatura. `neutral` usa el mismo matiz con saturación mínima para evitar dos "temperaturas" de gris distintas conviviendo en la UI. El **dorado** es un acento *decorativo* aparte (matiz cálido ~39°), con reglas de uso estrictas en [`../SKILL.md`](../SKILL.md) §3.6 — no forma parte del acento funcional.

El azul crudo del logo es `#0004B1` = `hsl(239 100% 35%)`, un ultramar a saturación máxima demasiado eléctrico para el tono del rubro (§SKILL.md §1). Por eso la marca en pantalla usa el **mismo matiz índigo pero desaturado y algo más profundo** (`brand-600` ≈ `hsl(240 55% 33%)`) — sobrio, no eléctrico. Otras anclas: dorado `#C6A15B` (≈ `gold-500`), negro suave de texto `#16181C` (≈ `neutral-950`).

```css
:root {
  /* Marca — índigo del logotipo, desaturado para sobriedad ("Azul Minaya") */
  --color-brand-50:  hsl(240 50% 97%);
  --color-brand-100: hsl(240 44% 92%);  /* chrome de navegación del admin (sidebar/topbar) */
  --color-brand-200: hsl(240 46% 85%);  /* hover/borde sobre el chrome */
  --color-brand-300: hsl(240 50% 74%);
  --color-brand-400: hsl(240 52% 57%);
  --color-brand-500: hsl(240 55% 44%);
  --color-brand-600: hsl(240 55% 33%);  /* base — acciones primarias, enlaces, foco (índigo sobrio) */
  --color-brand-700: hsl(240 60% 26%);  /* hover/active, hero, footer, títulos del sitio público */
  --color-brand-800: hsl(240 64% 20%);
  --color-brand-900: hsl(240 68% 14%);
  --color-brand-950: hsl(240 72% 9%);

  /* Neutral — gris frío, mismo matiz que la marca */
  --color-neutral-50:  hsl(240 20% 98%);
  --color-neutral-100: hsl(240 15% 95%);
  --color-neutral-200: hsl(240 12% 90%);
  --color-neutral-300: hsl(240 10% 82%);
  --color-neutral-400: hsl(240 8% 64%);
  --color-neutral-500: hsl(240 7% 48%);
  --color-neutral-600: hsl(240 9% 36%);
  --color-neutral-700: hsl(240 12% 26%);
  --color-neutral-800: hsl(240 15% 17%);
  --color-neutral-900: hsl(240 18% 11%);
  --color-neutral-950: hsl(240 20% 8%); /* ≈ #16181C — texto principal, nunca #000 puro */

  /* Dorado — acento DECORATIVO, no funcional (ver SKILL.md §3.6) */
  --color-gold-50:  hsl(39 55% 95%);
  --color-gold-100: hsl(39 52% 86%);
  --color-gold-300: hsl(39 50% 70%);
  --color-gold-500: hsl(39 48% 57%);  /* ≈ #C6A15B — líneas, bordes de acento, CTA destacado del sitio público */
  --color-gold-700: hsl(36 55% 34%);
  --color-gold-900: hsl(34 62% 14%);  /* ≈ #3A2A08 — único texto permitido SOBRE dorado */

  /* Semánticos — solo para estado, ver SKILL.md §3.3/3.4 */
  --color-success-50:  hsl(142 55% 96%);
  --color-success-100: hsl(142 50% 90%);
  --color-success-600: hsl(142 60% 32%);
  --color-success-700: hsl(142 62% 24%);

  --color-warning-50:  hsl(38 90% 96%);
  --color-warning-100: hsl(38 85% 88%);
  --color-warning-600: hsl(38 85% 45%);
  --color-warning-700: hsl(32 80% 34%);

  --color-danger-50:  hsl(0 70% 97%);
  --color-danger-100: hsl(0 65% 92%);
  --color-danger-600: hsl(0 65% 45%);
  --color-danger-700: hsl(0 68% 36%);

  /* Info — celeste, distinto del índigo de marca */
  --color-info-50:  hsl(205 75% 96%);
  --color-info-100: hsl(205 70% 90%);
  --color-info-600: hsl(205 70% 42%);
  --color-info-700: hsl(205 72% 32%);
}
```

> El dorado no lleva escala completa a propósito: su uso es puntual (§3.6). `gold-500` es el fill de acento; `gold-900` es el único color de texto válido sobre dorado (nunca blanco — no cumple AA). Como texto sobre fondo claro, el dorado no se usa (contraste insuficiente).

Uso en `tailwind.config.ts` (Tailwind v3 `theme.extend.colors`, o vía `@theme inline` en v4 apuntando a las variables de arriba):

```ts
colors: {
  brand: {
    50: 'var(--color-brand-50)', 100: 'var(--color-brand-100)', 200: 'var(--color-brand-200)',
    300: 'var(--color-brand-300)', 400: 'var(--color-brand-400)', 500: 'var(--color-brand-500)',
    600: 'var(--color-brand-600)', 700: 'var(--color-brand-700)', 800: 'var(--color-brand-800)',
    900: 'var(--color-brand-900)', 950: 'var(--color-brand-950)',
  },
  neutral: { /* mismo patrón con --color-neutral-* */ },
  gold: { 50: 'var(--color-gold-50)', 100: 'var(--color-gold-100)', 300: 'var(--color-gold-300)', 500: 'var(--color-gold-500)', 700: 'var(--color-gold-700)', 900: 'var(--color-gold-900)' },
  success: { 50: 'var(--color-success-50)', 100: 'var(--color-success-100)', 600: 'var(--color-success-600)', 700: 'var(--color-success-700)' },
  warning: { 50: 'var(--color-warning-50)', 100: 'var(--color-warning-100)', 600: 'var(--color-warning-600)', 700: 'var(--color-warning-700)' },
  danger:  { 50: 'var(--color-danger-50)',  100: 'var(--color-danger-100)',  600: 'var(--color-danger-600)',  700: 'var(--color-danger-700)' },
  info:    { 50: 'var(--color-info-50)',    100: 'var(--color-info-100)',    600: 'var(--color-info-600)',    700: 'var(--color-info-700)' },
}
```

## Tipografía

```css
--font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; /* UI + cuerpo, ambas apps */
--font-serif-accent: 'Lora', Georgia, serif; /* SOLO titulares grandes del sitio público, ver SKILL.md §4 */
```

Escala (mobile-first; los mismos tokens sirven en ambas apps):

```css
--text-xs:   0.75rem;  /* 12px */  --leading-xs:   1rem;    /* 16px */
--text-sm:   0.875rem; /* 14px */  --leading-sm:   1.25rem; /* 20px */
--text-base: 1rem;     /* 16px */  --leading-base: 1.5rem;  /* 24px */
--text-lg:   1.125rem; /* 18px */  --leading-lg:   1.75rem; /* 28px */
--text-xl:   1.25rem;  /* 20px */  --leading-xl:   1.75rem; /* 28px */
--text-2xl:  1.5rem;   /* 24px */  --leading-2xl:  2rem;    /* 32px */
--text-3xl:  1.875rem; /* 30px */  --leading-3xl:  2.375rem;/* 38px */
--text-4xl:  2.25rem;  /* 36px */  --leading-4xl:  2.75rem; /* 44px */
--text-5xl:  3rem;     /* 48px */  --leading-5xl:  1.1;
--text-6xl:  3.75rem;  /* 60px */  --leading-6xl:  1.1;

--font-weight-regular:  400;
--font-weight-medium:   500;
--font-weight-semibold: 600;
```

## Espaciado

Escala base 4px (estándar Tailwind — no se personaliza, se documenta el uso semántico):

| Token Tailwind | px | Uso típico |
|---|---|---|
| `2` | 8px | gap ícono↔texto, label↔input |
| `3` | 12px | padding vertical de input/botón |
| `4` | 16px | padding horizontal de input/botón, gap entre campos |
| `6` | 24px | padding de card (desktop), gap entre campos con ayuda visual |
| `8` | 32px | separación entre bloques dentro de una sección |
| `12` | 48px | separación entre secciones (mobile) |
| `16` | 64px | separación entre secciones (desktop) |

## Radios y sombras

```css
--radius-sm: 0.25rem;  /* 4px  — badges, chips */
--radius-md: 0.5rem;   /* 8px  — inputs, botones */
--radius-lg: 0.5rem;   /* 8px  — cards (igual a md por consistencia) */
--radius-full: 9999px; /* pastillas de estado, avatares */

--shadow-sm: 0 1px 2px 0 hsl(240 30% 20% / 0.06);
--shadow-md: 0 4px 8px -2px hsl(240 30% 20% / 0.08), 0 2px 4px -2px hsl(240 30% 20% / 0.04);
/* No existe --shadow-lg/xl en este sistema: el tono es sobrio, shadow-md es el máximo permitido (SKILL.md §15) */
```

## Breakpoints

Estándar Tailwind, sin personalizar — documentados en `SKILL.md` §8: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px.

## Contenedores

```css
--container-public: 1200px; /* apps/web */
--container-admin: 1440px;  /* área de contenido de apps/admin, excluye sidebar */
--sidebar-width-expanded: 240px;
--sidebar-width-collapsed: 64px;
--topbar-height: 56px;
```
