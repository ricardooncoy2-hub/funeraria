# 29 — Testing

## 29.1 Pirámide de pruebas

- **Unit** (mayoría): lógica de services (cálculos, reglas), utilidades. Prisma mockeado o BD en memoria/efímera.
- **Integration**: services + Prisma contra **MariaDB efímera** (Docker) con migraciones aplicadas. Verifican transacciones y constraints reales.
- **API/E2E**: `supertest` contra la app NestJS levantada; validan endpoints, autorización y códigos de error.
- **Frontend**: unit (componentes con Testing Library), e2e opcional (Playwright) para flujos críticos del admin (login, venta, pago).

## 29.2 Tipos requeridos (del prompt)

Unit, integration, API, autorización, multi-sede, inventario, transferencias, ventas, pagos, financiamiento, caja.

## 29.3 Casos críticos (obligatorios)

Mapa de los 14 casos del prompt a criterios de aceptación:

| # | Caso | CA |
|---|---|---|
| 1 | Usuario de Sede A intenta consultar Sede B → 403 | CA-SEC-01 |
| 2 | Venta de Sede A descuenta stock de Sede A | CA-INV-01 |
| 3 | Venta de Sede A no modifica stock de Sede B | CA-INV-01 |
| 4 | Transferencia resta inventario de origen | CA-TRF-01 |
| 5 | Transferencia suma inventario de destino | CA-TRF-02 |
| 6 | Pago en efectivo genera movimiento de caja | CA-PAY-04 |
| 7 | Pago POS no genera movimiento de caja física | CA-PAY-02 |
| 8 | Pago por transferencia se registra en destino principal | CA-PAY-03 |
| 9 | Venta parcialmente financiada | CA-FIN-01 |
| 10 | Venta totalmente financiada | CA-FIN-01 |
| 11 | Financiamiento pendiente | CA-FIN-03 |
| 12 | Pago posterior de aseguradora | CA-FIN-03 |
| 13 | Anulación de venta | CA-SALE-03 |
| 14 | Reversión de inventario | CA-SALE-03 |

## 29.4 Pruebas de autorización (multi-sede)

- Un usuario asignado a Caraz recibe `403` al consultar/operar sobre Yungay.
- Un usuario corporativo accede a todas las sedes.
- Un `sede_id` de query fuera del alcance se rechaza (no se confía en el cliente, RB-018).
- Verificar cada endpoint sensible con roles permitidos y no permitidos.

## 29.5 Pruebas de integridad transaccional

- Venta que falla a mitad (p. ej. stock insuficiente en la 2ª línea) **no** deja stock descontado ni venta parcial (rollback completo).
- Transferencia interrumpida no deja inventarios inconsistentes.
- Pago en efectivo sin caja abierta → error, sin registro.
- Concurrencia: dos ventas simultáneas del mismo producto/sede no dejan stock negativo (bloqueo `FOR UPDATE`).

## 29.6 Datos de prueba (fixtures/seed)

- Empresa, sede principal + 2 provinciales (Caraz, Yungay).
- Productos con stock por sede; servicios con/ sin override; un plan.
- Financiadores (cliente, una aseguradora, SIS).
- Usuarios por rol con distintos alcances de sede.

## 29.7 Cobertura objetivo

- ≥ 80% en services de `inventory`, `sales`, `payments`, `financing`, `cash`, `inventory-transfers`, `authz`.
- Los demás módulos, cobertura razonable de rutas y validaciones.

## 29.8 Entorno de test en CI

- MariaDB como servicio del runner; `DATABASE_URL` de test; `prisma migrate deploy` + seed de test antes de correr integration/API.
- Aislar cada test o usar transacciones con rollback por test para independencia.

## 29.9 Ejemplos de aserciones (pseudodescripción)

- `POST /ventas` (Caraz, 3 uds de P1): `inventarios(Caraz,P1).stock_actual` baja 3; `inventarios(Yungay,P1)` sin cambios; existe `movimiento VENTA`; `Σ financiamientos == total`.
- `POST /pagos` (POS): no existe `movimiento_caja` asociado; pago con `apertura_caja_id = null`.
- `POST /pagos` (EFECTIVO sin caja abierta): responde `409/422`; sin `pago` creado.
