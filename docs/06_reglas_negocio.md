# 06 — Reglas de Negocio

Estas reglas son de cumplimiento **obligatorio** y transversal. Cada una tiene su reflejo en modelo de datos, API, autorización y pruebas.

## 6.1 Reglas fundamentales (del negocio)

- **RB-001 — Compras centralizadas.** Las compras a proveedores se realizan **exclusivamente desde la sede principal**. Las sedes provinciales no compran directamente, salvo habilitación futura por configuración (`config.compras_descentralizadas = false` por defecto).
- **RB-002 — Inventario por sede.** El inventario se administra por sede. No existe un stock global como única fuente; el stock global es una suma derivada.
- **RB-003 — Distribución por transferencia.** La sede principal puede transferir productos a otras sedes.
- **RB-004 — Doble efecto de transferencia.** Una transferencia confirmada genera **salida** en la sede origen y **entrada** en la sede destino, con cantidades iguales.
- **RB-005 — Ventas por sede.** Cualquier sede activa puede realizar ventas.
- **RB-006 — Pertenencia de venta.** Toda venta pertenece a una **sede de venta** (`sede_venta_id`).
- **RB-007 — Sede de venta ≠ sede de cobro.** La sede donde se registra la venta puede diferir de la sede/medio donde se recibe el dinero.
- **RB-008 — Efectivo a caja de la sede de cobro.** El efectivo recibido se registra en la caja **de la sede donde se recibe** el efectivo.
- **RB-009 — Electrónicos a cuentas principales.** Los pagos electrónicos (POS, transferencia, Yape/Plin) se dirigen a **destinos** administrados por la sede principal por defecto (configurable).
- **RB-010 — Múltiples pagos por venta.** Una venta puede tener varios pagos.
- **RB-011 — Múltiples financiamientos por venta.** Una venta puede tener varias fuentes de financiamiento.
- **RB-012 — Financiadores ≠ métodos de pago.** SIS, EsSalud y aseguradoras son financiadores/coberturas, no métodos de pago.
- **RB-013 — Independencia financiamiento/pago.** El financiamiento (quién asume el costo) y el pago (dinero recibido) son conceptos independientes.
- **RB-014 — Coberturas parciales o totales.** Una cobertura de financiador puede cubrir total o parcialmente el monto asignado.
- **RB-015 — Obligación pendiente post-servicio.** La obligación de un financiador puede seguir pendiente después de prestado el servicio.
- **RB-016 — Pago posterior reduce saldo.** Los pagos posteriores de un financiador reducen su saldo pendiente.
- **RB-017 — Transaccionalidad.** Las operaciones críticas (compra+inventario, transferencia+inventarios, venta+inventario, pago+CxC/caja, apertura/cierre de caja) deben ser transaccionales (ACID).
- **RB-018 — Aislamiento por sede.** Un usuario solo accede a información de las sedes que tiene autorizadas.
- **RB-019 — Consolidado corporativo.** Los administradores corporativos pueden consultar información consolidada de todas las sedes.
- **RB-020 — No borrado histórico.** Las operaciones históricas críticas no se eliminan físicamente; se anulan/cancelan con trazabilidad.

## 6.2 Reglas complementarias (derivadas y necesarias para implementar)

- **RB-021 — Suma de financiamientos = total de venta.** Al confirmar una venta, la suma de los `financiamientos.monto` debe ser igual al `ventas.total`. El sistema no permite confirmar una venta con financiamiento incompleto o sobre-financiado.
- **RB-022 — Pago se aplica a un financiamiento.** Todo pago se asocia a exactamente un `financiamiento` (que define el financiador y, por tanto, si es cliente o institución). La suma de pagos aplicados a un financiamiento no puede exceder su `monto` (salvo excedente autorizado, deshabilitado por defecto).
- **RB-023 — Saldo pendiente de financiamiento.** `saldo_pendiente = monto − Σ pagos_aplicados`. La cuenta por cobrar de un financiador institucional es su `saldo_pendiente > 0`.
- **RB-024 — Sede principal única.** Debe existir **exactamente una** sede activa con `is_main = true`. Cambiar la sede principal es una operación auditada y controlada.
- **RB-025 — Stock no negativo.** El stock de inventario no puede quedar negativo tras una operación; las salidas se rechazan si no hay stock suficiente (venta, transferencia, ajuste de salida, merma).
- **RB-026 — Caja abierta para efectivo.** No se puede registrar un movimiento de efectivo (ni pago en efectivo) sin una apertura de caja vigente en la sede de cobro.
- **RB-027 — Un pago electrónico requiere destino electrónico.** Los métodos POS/TRANSFERENCIA/YAPE/PLIN requieren un `destino_pago` de tipo no-caja; el método EFECTIVO requiere un `destino_pago` de tipo caja de la sede de cobro.
- **RB-028 — Anulación revierte efectos.** Anular una venta confirmada revierte inventario (movimiento de reversión) y marca sus financiamientos/pagos según política (ver [20](20_ventas.md)); los pagos ya recibidos requieren decisión explícita (devolución registrada), no se borran.
- **RB-029 — Precio de servicio por sede.** Si existe `sede_servicio.precio`, éste prevalece sobre `servicios.precio_base` para esa sede.
- **RB-030 — Disponibilidad de plan por sede.** Un plan está disponible en una sede solo si todos sus servicios están habilitados en esa sede y sus productos tienen stock suficiente (validación en cotización/venta; el plan puede mostrarse en web como referencia).

## 6.3 Reglas de cálculo

- **RC-001 — Costo promedio ponderado.** Al recepcionar una compra en la sede principal:
  `nuevo_costo_promedio = (stock_actual × costo_promedio + cantidad × costo_unitario) / (stock_actual + cantidad)`.
- **RC-002 — Total de venta.** `total = Σ(detalle.subtotal) − descuento_global + impuestos`, donde `detalle.subtotal = cantidad × precio_unitario − descuento_linea` y los impuestos se calculan por ítem según su afectación de IGV.
- **RC-003 — IGV.** IGV configurable (18% por defecto). Ítems inafectos/exonerados no generan IGV. El sistema guarda base imponible, IGV y total por venta.

## 6.4 Trazabilidad de reglas → artefactos

| Regla | Modelo de datos | API | Test |
|-------|-----------------|-----|------|
| RB-006/007 | `ventas.sede_venta_id`, `pagos.sede_cobro_id` | Ventas/Pagos | CA-PAY-04 |
| RB-010 | `pagos` 1..N por venta | Pagos | CA-PAY-01 |
| RB-011/021 | `financiamientos` 1..N por venta | Financiamiento | CA-FIN-01 |
| RB-012 | `financiadores` vs `metodos_pago` | Ambos | CA-FIN-02 |
| RB-013/023 | `financiamientos` + `pagos` | CxC | CA-FIN-03 |
| RB-002/025 | `inventarios`, `movimientos_inventario` | Inventario | CA-INV-01..03 |
| RB-004 | `transferencias_inventario` | Transferencias | CA-TRF-01..02 |
| RB-008/026 | `movimientos_caja`, `aperturas_caja` | Caja | CA-CASH-01 |
| RB-009/027 | `destinos_pago` | Pagos | CA-PAY-02..03 |
| RB-018 | `usuario_sede` + guard | Todos | CA-SEC-01 |
