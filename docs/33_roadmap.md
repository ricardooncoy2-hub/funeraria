# 33 — Roadmap

Fases ordenadas por dependencias. Cada fase entrega valor y deja base para la siguiente.

## Fase 0 — Fundaciones técnicas
- Monorepo, tooling (ESLint/Prettier/TS), Docker Compose local.
- Prisma + esquema base + migraciones iniciales + seed (empresa, sede principal, roles/permisos, métodos de pago).
- Esqueleto NestJS (módulos vacíos, guards, config, health).
- CI básico (lint, typecheck, test, build).

## Fase 1 — Fundamentos (negocio base)
- `auth` (JWT + refresh), `users`, `roles`/`permisos`, `authz` (RBAC + alcance de sede).
- `branches` (sedes, sede principal).
- `products`, `services` (+ disponibilidad/precio por sede), `plans`.
- `customers`.
- **Salida:** login, gestión de usuarios/sedes/catálogos/clientes con seguridad multi-sede.
- **Verifica:** CA-SEC-01.

## Fase 2 — Inventario
- `inventory` (inventarios, movimientos, kardex, ajustes, stock bajo).
- `purchases` (compras centralizadas + efecto inventario).
- `inventory-transfers` (transferencias con estados y doble movimiento).
- **Salida:** control de stock por sede, compras y distribución.
- **Verifica:** CA-INV-01..03, CA-TRF-01..02.

## Fase 3 — Ventas
- `quotations` (internas) → conversión a venta.
- `sales` (venta, detalle, servicios contratados, anulación) con descuento de stock.
- `payments` (registro básico de pagos del cliente; métodos/destinos).
- **Salida:** ciclo de venta y cobro del cliente.
- **Verifica:** CA-SALE-01..03, CA-PAY-01.

## Fase 4 — Financiamiento
- `financing` (financiadores, financiamientos, coberturas, estados).
- Cuentas por cobrar y pagos posteriores de instituciones.
- **Salida:** ventas con múltiples financiadores y gestión de CxC.
- **Verifica:** CA-FIN-01..03, CA-PAY-02..03.

## Fase 5 — Caja
- `cash` (cajas, apertura, movimientos, cierre/arqueo).
- Integración pago efectivo ↔ caja; validación de caja abierta.
- **Salida:** control de efectivo por sede con arqueo.
- **Verifica:** CA-PAY-04, CA-CASH-01.

## Fase 6 — Web pública
- Sitio Next.js público: servicios, productos, planes, promociones, sedes, contacto, FAQ.
- Formulario de cotización (origen WEB) + WhatsApp + consentimiento.
- SEO y performance.
- **Salida:** captación pública y cotizaciones web integradas al admin.
- **Verifica:** CA-QUO-01, CA-SEO-01..03.

## Fase 7 — Reportes, auditoría y optimización
- `reports` por sede y consolidados; exportaciones.
- `audit` completo (interceptor + consulta).
- Observabilidad, backups automatizados, endurecimiento de seguridad.
- Optimización de índices/consultas.
- **Salida:** operación completa, auditable y monitoreada.
- **Verifica:** CA-REP-01..03, CA-AUD-01..02.

## Cronograma indicativo

```mermaid
gantt
  dateFormat  YYYY-MM-DD
  title Roadmap Funeraria Minaya (indicativo)
  section Base
  Fase 0 Fundaciones        :f0, 2026-01-01, 10d
  Fase 1 Fundamentos        :f1, after f0, 20d
  section Operación
  Fase 2 Inventario         :f2, after f1, 20d
  Fase 3 Ventas             :f3, after f2, 20d
  Fase 4 Financiamiento     :f4, after f3, 15d
  Fase 5 Caja               :f5, after f4, 12d
  section Público y cierre
  Fase 6 Web pública        :f6, after f5, 18d
  Fase 7 Reportes/Auditoría :f7, after f6, 18d
```

> Los tiempos son orientativos y deben ajustarse al equipo real. El orden de dependencias (auth→sedes→catálogos→inventario→ventas→financiamiento→caja→web→reportes) sí es recomendado mantenerlo.

## Ajustes de dependencia

- `payments` se inicia en Fase 3 (pagos del cliente) y se completa en Fase 4 (pagos institucionales) y Fase 5 (integración con caja). Es un módulo que madura en tres fases.
- La web pública (Fase 6) depende de catálogos (Fase 1) y cotizaciones (base en Fase 3).
