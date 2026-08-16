# 36 — Criterios de Aceptación y Checklist de Consistencia

## 36.1 Criterios de aceptación por dominio

### Seguridad / multi-sede
- **CA-SEC-01** Un usuario asignado solo a Sede A recibe `403` al consultar u operar sobre Sede B. Un `sede_id` fuera de su alcance en filtros se rechaza (no se confía en el cliente). Un usuario corporativo accede a todas las sedes.

### Inventario
- **CA-INV-01** Al registrar una venta de 3 unidades en Sede Caraz, el inventario de Caraz disminuye en 3 y el de las demás sedes permanece sin cambios.
- **CA-INV-02** Una salida que dejaría stock negativo se rechaza (`409`), sin registrar movimiento.
- **CA-INV-03** El kardex reconstruido desde `movimientos_inventario` coincide con `inventarios.stock_actual`.

### Compras
- **CA-PUR-01** Recepcionar una compra incrementa el inventario de la **sede principal** y recalcula el costo promedio (RC-001); genera movimiento `COMPRA` y auditoría.

### Transferencias
- **CA-TRF-01** Al enviar una transferencia, el inventario del origen disminuye en la cantidad transferida (movimiento `TRANSFERENCIA_SALIDA`).
- **CA-TRF-02** Al recibir, el inventario del destino aumenta en la misma cantidad (movimiento `TRANSFERENCIA_ENTRADA`); el stock global consolidado se conserva.

### Ventas
- **CA-SALE-01** Una venta con productos descuenta stock solo de la sede de venta.
- **CA-SALE-02** La suma de financiamientos iguala el total; el sistema no confirma una venta con financiamiento incompleto o excedido.
- **CA-SALE-03** Anular una venta reingresa el stock (movimiento de reversión) y deja trazabilidad sin borrado físico; los pagos previos requieren decisión explícita (devolución/bloqueo).

### Financiamiento / CxC
- **CA-FIN-01** Una venta de S/ 5,000 con cliente S/ 3,000 y aseguradora S/ 2,000 registra ambos financiadores y calcula el saldo pendiente de cada uno.
- **CA-FIN-02** SIS/EsSalud/aseguradoras se registran como financiadores, nunca como método de pago.
- **CA-FIN-03** Tras el pago del cliente (S/ 3,000) y antes del pago de la aseguradora: cobrado 3,000, por cobrar 2,000; cuando la aseguradora paga, por cobrar 0.

### Pagos / Caja
- **CA-PAY-01** Una venta admite múltiples pagos que suman hasta el total financiado; no se excede el monto del financiamiento.
- **CA-PAY-02** Un pago POS no genera movimiento de caja física.
- **CA-PAY-03** Un pago por transferencia de una venta de Sede Caraz se registra con `sede_venta = Caraz` y destino = cuenta principal (`sede_cobro = Principal`).
- **CA-PAY-04** Un pago en efectivo en Sede Caraz genera un movimiento en la caja de Caraz y requiere caja abierta.
- **CA-CASH-01** No se puede registrar efectivo sin caja abierta; el arqueo calcula `diferencia = contado − esperado` correctamente.

### Cotizaciones
- **CA-QUO-01** Una cotización web se crea con origen `WEB`, estado `SOLICITADA` y consentimiento registrado.
- **CA-QUO-02** Una cotización aceptada se convierte en venta heredando cliente e ítems, con `cotizacion_id` en la venta.
- **CA-QUO-03** Una cotización con `valido_hasta` vencido pasa a `VENCIDA` por la tarea programada.

### Reportes
- **CA-REP-01** Un usuario de una sola sede no ve datos de otras sedes en ningún reporte.
- **CA-REP-02** El inventario consolidado equivale a la suma por sede.
- **CA-REP-03** Las CxC por financiador reflejan `monto − cobrado` de financiamientos aprobados.

### Auditoría
- **CA-AUD-01** Cada venta, pago, anulación, transferencia, compra, apertura/cierre de caja y cambio de permisos genera un registro de auditoría con actor, entidad y timestamp.
- **CA-AUD-02** Los registros de auditoría no pueden modificarse ni borrarse desde la aplicación.

### SEO / público
- **CA-SEO-01** Cada página pública tiene title/description únicos y canonical.
- **CA-SEO-02** El admin no es indexable; el sitemap solo incluye páginas públicas.
- **CA-SEO-03** Cada sede tiene JSON-LD `LocalBusiness` con NAP correcto.

### Protección de datos
- **CA-DP-01** El formulario público exige consentimiento (no premarcado) y solo captura datos mínimos.
- **CA-DP-02** Existe procedimiento operativo para acceso/rectificación/cancelación de datos de un titular.

## 36.2 Trazabilidad requisitos ↔ reglas ↔ criterios

| Requisito | Regla | Criterio |
|---|---|---|
| RF-041/042/093 | RB-002/025 | CA-INV-01..03, CA-SALE-01 |
| RF-051/052 | RB-001, RC-001 | CA-PUR-01 |
| RF-062/063 | RB-004, RB-017 | CA-TRF-01..02 |
| RF-094 | RB-021 | CA-SALE-02, CA-FIN-01 |
| RF-100..105 | RB-011..016, RB-022/023 | CA-FIN-01..03, CA-REP-03 |
| RF-111..115 | RB-007/008/009/027 | CA-PAY-01..04 |
| RF-121..124 | RB-008/026 | CA-CASH-01 |
| RF-012/RF-132 | RB-018/019 | CA-SEC-01, CA-REP-01 |
| RF-095 | RB-020/028 | CA-SALE-03, CA-AUD-01 |

---

## 36.3 CHECKLIST DE CONSISTENCIA

Verificación de que la especificación es coherente de extremo a extremo. Cada ítem indica **dónde** se satisface.

- [x] **Multi-sede correctamente modelada** — base única + `sede_id` + guard de alcance. ([09](09_arquitectura_multi_sede.md), ADR-006)
- [x] **Compras centralizadas** — `compras.sede_id = principal`, flag para descentralizar. ([19](19_compras_transferencias.md), RB-001, ADR-007)
- [x] **Inventario por sede** — `inventarios UNIQUE(sede_id, producto_id)`, sin `productos.stock`. ([18](18_inventario.md), ADR-008)
- [x] **Transferencias entre sedes** — estados + doble movimiento transaccional. ([19](19_compras_transferencias.md), ADR-013)
- [x] **Ventas por sede** — `ventas.sede_venta_id`. ([20](20_ventas.md), RB-006)
- [x] **Sede de venta separada de sede de cobro** — `sede_venta_id` ≠ `sede_cobro_id`. ([22](22_pagos_cajas.md), ADR-009, RB-007)
- [x] **Pagos separados de ventas** — `pagos` 1..N por venta. ([22](22_pagos_cajas.md), RB-010)
- [x] **Financiamiento separado de pagos** — `financiamientos` vs `pagos`; pago aplica a financiamiento. ([21](21_financiamiento.md), ADR-010, RB-013)
- [x] **SIS/EsSalud/aseguradoras como financiadores** — `financiadores` ≠ `metodos_pago`. ([21](21_financiamiento.md), ADR-012, RB-012)
- [x] **Coberturas parciales y totales** — `financiamientos.monto`/`monto_autorizado`. ([21](21_financiamiento.md), RB-014)
- [x] **Cuentas por cobrar** — `saldo = monto − Σ pagos`; reporte por financiador. ([21](21_financiamiento.md), [24](24_reportes.md), RB-023)
- [x] **Caja para efectivo** — `cajas`/`aperturas_caja`/`movimientos_caja` solo efectivo. ([22](22_pagos_cajas.md), ADR-011)
- [x] **POS y transferencias fuera de caja física** — validación método↔destino. ([22](22_pagos_cajas.md), RB-027)
- [x] **Usuarios con acceso por sede** — `usuario_sede` + `es_corporativo`/`sede.acceso_total`. ([09](09_arquitectura_multi_sede.md), [16](16_seguridad.md), RB-018)
- [x] **Reportes por sede y consolidados** — respetan alcance. ([24](24_reportes.md), RB-019)
- [x] **Auditoría** — eventos críticos append-only. ([25](25_auditoria.md))
- [x] **Protección de datos** — Ley 29733: consentimiento, minimización, ARCO, retención. ([17](17_proteccion_datos.md))
- [x] **Integridad transaccional** — `$transaction` + `FOR UPDATE` en operaciones críticas. ([13](13_modulos_backend.md), [18](18_inventario.md), RB-017)
- [x] **Nomenclatura de base de datos consistente** — snake_case, plural, sin tildes/ñ; Prisma `@map`. ([11](11_convencion_base_datos.md), ADR-003)
- [x] **API documentada** — REST `/api/v1` + OpenAPI/Swagger. ([14](14_api.md))
- [x] **Arquitectura desplegable en VPS** — Docker Compose + Nginx + Cloudflare. ([26](26_infraestructura.md), [27](27_docker.md))
- [x] **Seguridad** — JWT+refresh, RBAC+sede, hardening. ([16](16_seguridad.md))
- [x] **Backups** — automáticos, cifrados, fuera del VPS, con prueba de restore. ([30](30_backups.md))
- [x] **Testing** — unit/integration/API + 14 casos críticos. ([29](29_testing.md))
- [x] **Roadmap** — 8 fases por dependencias. ([33](33_roadmap.md))

## 36.4 Verificación de no-contradicción (extremo a extremo)

REQUISITOS → REGLAS → CASOS DE USO → ARQUITECTURA → MODELO DE DATOS → API → FRONTEND → SEGURIDAD → TESTING → INFRAESTRUCTURA:

- **Sede venta≠cobro:** RF-115 → RB-007 → CU-041 → ADR-009 → `ventas.sede_venta_id`/`pagos.sede_cobro_id` → `POST /pagos` → wizard de pago → guard de sede → CA-PAY-03 → destinos administrados por principal. **Coherente.**
- **Venta/financiamiento/pago:** RF-094/100/111 → RB-010/011/013/021/022 → CU-030/050 → ADR-010 → `ventas`/`financiamientos`/`pagos` → endpoints respectivos → wizard financiamiento → permisos → CA-FIN/PAY → infra transaccional. **Coherente.**
- **Financiadores≠métodos:** RF-036/110 → RB-012 → CU-050 → ADR-012 → `financiadores`/`metodos_pago` → API separada → UI separada → validación dominio → CA-FIN-02. **Coherente.**
- **Inventario por sede:** RF-040..043/093 → RB-002/025 → CU-030/080 → ADR-008 → `inventarios`/`movimientos_inventario` → API inventario/ventas → vistas de stock por sede → guard → CA-INV → transacciones. **Coherente.**
- **Compras centralizadas + transferencias:** RF-050..065 → RB-001/003/004 → CU-010/020 → ADR-007/013 → tablas compras/transferencias → endpoints → UI → permisos → CA-PUR/TRF → transacciones. **Coherente.**

**Conclusión:** no se detectan contradicciones entre los componentes de la especificación. La documentación puede considerarse la **ESPECIFICACIÓN BASE** para la implementación por un equipo de desarrollo o por Claude Code.

## 36.5 Definición de "listo" (Definition of Done) por módulo

Un módulo se considera terminado cuando: (1) cumple sus RF; (2) respeta sus RB; (3) pasa sus CA con tests automatizados; (4) valida autorización por rol y sede; (5) registra auditoría de sus eventos críticos; (6) documenta sus endpoints en OpenAPI; (7) sus operaciones críticas son transaccionales; y (8) no permite borrado físico de datos históricos.
