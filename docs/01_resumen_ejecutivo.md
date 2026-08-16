# 01 — Resumen Ejecutivo

## 1.1 Propósito

FUNERARIA MINAYA es una PYME peruana con una **sede principal** y **sedes provinciales**. Requiere un sistema web integral que administre su operación multi-sede (inventario, compras, transferencias, ventas, cotizaciones, financiamiento, pagos y cajas) y que ofrezca un **sitio web público** para captar clientes y solicitudes de cotización.

Este sistema debe reflejar con fidelidad tres realidades del negocio que suelen modelarse mal en sistemas genéricos:

1. **La sede de venta no es necesariamente la sede de cobro.** Una venta en una sede provincial puede cobrarse mediante transferencia o POS en cuentas administradas por la sede principal.
2. **Venta, financiamiento y pago son conceptos independientes.** Una venta define *qué se vendió y cuánto vale*; el financiamiento define *quién asume el costo* (cliente, SIS, EsSalud, aseguradora); el pago define *el dinero efectivamente recibido*.
3. **SIS, EsSalud y aseguradoras NO son métodos de pago:** son **financiadores/coberturas** que generan **cuentas por cobrar**.

## 1.2 Objetivo del sistema

Proveer una plataforma que administre de forma consistente y auditable:

- Sedes, usuarios, roles y permisos con **alcance por sede**.
- Catálogos maestros corporativos: productos, servicios, planes, proveedores, financiadores.
- **Inventario por sede** con kardex reconstruible desde movimientos.
- **Compras centralizadas** en la sede principal.
- **Transferencias de inventario** entre sedes.
- **Ventas** con productos, servicios y planes.
- **Cotizaciones** desde web, WhatsApp, teléfono o presencial.
- **Financiamiento** multi-fuente (cliente + institución) y **cuentas por cobrar**.
- **Pagos** múltiples por venta, con **método** y **destino del dinero** separados.
- **Cajas** para control exclusivo de efectivo.
- **Reportes** por sede y consolidados, respetando permisos.
- **Auditoría** de eventos críticos.
- **Sitio público** con información institucional, catálogo y solicitud de cotización.

## 1.3 Stack tecnológico

| Capa | Tecnología | ADR |
|------|-----------|-----|
| Sitio público | Next.js + React + TypeScript + Tailwind CSS | ADR-004 |
| Frontend administrativo | Next.js + React + TypeScript + Tailwind CSS | ADR-004 |
| Backend | NestJS + TypeScript (monolito modular) | ADR-001, ADR-005 |
| ORM | Prisma | ADR-003 |
| Base de datos | MariaDB 11.8 LTS | ADR-002 |
| Reverse proxy | Nginx | — |
| CDN/WAF | Cloudflare | — |
| Contenedores | Docker + Docker Compose | — |
| Almacenamiento de archivos | S3-compatible (MinIO / proveedor) | — |
| Cache/colas (opcional) | Redis (solo si se justifica) | — |

## 1.4 Principios arquitectónicos rectores

1. **Multi-sede sobre una sola base de datos MariaDB.** No hay una base de datos por sede.
2. **Información corporativa vs información por sede** claramente separada (ver [09](09_arquitectura_multi_sede.md)).
3. **Autorización siempre en backend.** El frontend nunca es la fuente de verdad de seguridad.
4. **Transaccionalidad ACID** para operaciones de inventario, transferencias, ventas y pagos.
5. **No eliminación física** de transacciones históricas críticas (soft delete + anulación con trazabilidad).
6. **Sin sobreingeniería:** monolito modular, no microservicios, no Kubernetes, no una base por sede.
7. **Minimización de datos personales**, conforme a Ley N.° 29733.

## 1.5 Decisiones arquitectónicas clave (resumen)

| ADR | Decisión |
|-----|----------|
| ADR-001 | Monolito modular (no microservicios) |
| ADR-002 | MariaDB 11.8 LTS como RDBMS único |
| ADR-003 | Prisma como ORM |
| ADR-006 | Multi-sede en base única con columna `sede_id` en entidades operativas |
| ADR-007 | Compras centralizadas en sede principal |
| ADR-008 | Inventario por sede (`inventarios` con `UNIQUE(sede_id, producto_id)`) |
| ADR-009 | Separación **sede de venta** / **sede de cobro** |
| ADR-010 | Separación **venta / financiamiento / pago** |
| ADR-011 | Caja exclusiva para efectivo; pagos electrónicos fuera de caja física |
| ADR-012 | Financiadores separados de métodos de pago |
| ADR-013 | Transferencias entre sedes con estados y doble movimiento de inventario |

Detalle completo en [34_decisiones_arquitectonicas.md](34_decisiones_arquitectonicas.md).

## 1.6 Entregables de la fase de especificación

Los 36 documentos listados en [00_indice.md](00_indice.md), coherentes entre sí, con diagramas Mermaid, ADRs, matriz de autorización, modelo de datos completo, diseño de API y checklist de consistencia final.

## 1.7 Infraestructura objetivo inicial

VPS Linux con aproximadamente **4 vCPU / 8 GB RAM / 80–160 GB SSD/NVMe**, suficiente para la operación de una PYME. Escalamiento posterior descrito en [26](26_infraestructura.md) y [55 del prompt / RNF de escalabilidad].

## 1.8 Dominios de referencia

- `www.funeraria-minaya.pe` → sitio público.
- `app.funeraria-minaya.pe` → frontend administrativo.
- `api.funeraria-minaya.pe` → backend NestJS.

(Ejemplos; ajustar al dominio definitivo.)
