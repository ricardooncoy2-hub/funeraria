# 24 — Reportes

Todos los reportes respetan el **alcance de sede** del usuario (RB-018, RF-132). Los consolidados requieren `reportes.consolidado` (acceso corporativo).

## 24.1 Reportes por sede

| Reporte | Fuente | Parámetros |
|---|---|---|
| Ventas | `ventas` (sede_venta_id) | sede, rango, estado |
| Productos vendidos | `detalle_venta` | sede, rango |
| Servicios vendidos | `detalle_venta` (SERVICIO) | sede, rango |
| Inventario | `inventarios` | sede |
| Kardex | `movimientos_inventario` | sede, producto, rango |
| Stock bajo | `inventarios` (stock ≤ mínimo) | sede |
| Compras | `compras` | rango (solo principal) |
| Transferencias | `transferencias_inventario` | sede origen/destino, estado, rango |
| Caja | `movimientos_caja`, `aperturas_caja` | sede, apertura, rango |
| Pagos | `pagos` | sede_cobro, método, rango |
| Cuentas por cobrar | `financiamientos` + `pagos` | financiador, sede, antigüedad |
| Financiamientos | `financiamientos` | estado, financiador, rango |

## 24.2 Reportes consolidados corporativos

| Reporte | Descripción |
|---|---|
| Ventas consolidadas | Total y detalle por todas las sedes |
| Inventario consolidado | Stock global por producto = Σ sedes |
| Ventas por sede | Comparativo por sede |
| Comparativo de sedes | KPIs (ventas, ticket promedio, margen) por sede |
| Productos más vendidos | Ranking |
| Servicios más vendidos | Ranking |
| Financiamiento por institución | Montos por financiador |
| CxC por aseguradora | Saldos pendientes por financiador con antigüedad |
| Flujo de efectivo por sede | Ingresos/egresos de caja por sede |
| Métodos de pago | Distribución por método y destino |
| Margen | Cuando exista costo suficiente (precio − costo promedio) |

## 24.3 Cálculos clave

- **Ticket promedio** = `Σ total / nº ventas` en el periodo/sede.
- **Margen bruto** (aproximado) = `Σ (precio_venta − costo_promedio) × cantidad` para líneas de producto (los servicios sin costo asociado se excluyen o se estiman por configuración).
- **Flujo de efectivo por sede** usa `sede_cobro`/caja, no `sede_venta`.
- **Ventas por sede** usa `sede_venta_id`.

> Nota: el "flujo de efectivo por sede" y "ventas por sede" pueden diferir por la separación venta/cobro (RB-007). Los reportes lo explicitan.

## 24.4 Exportación

Formatos: JSON (UI), CSV, XLSX, PDF. Parámetro `?formato=`. Exportaciones grandes se generan asíncronamente y se entregan por enlace (S3 prefirmado) si superan un umbral.

## 24.5 Rendimiento

- Reportes sobre índices `(sede_id, fecha)`, `(sede_id, producto_id)`, `financiador_id`, `estado`.
- Para consolidados pesados, considerar vistas materializadas o agregaciones nocturnas (solo si se justifica por volumen; PYME probablemente no lo requiere en v1).

## 24.6 Dashboard (admin)

KPIs por sede activa seleccionada: ventas del día/mes, nº de servicios contratados en curso, stock bajo, CxC pendientes, estado de caja. Para corporativos, vista consolidada.

## 24.7 Criterios de aceptación

- **CA-REP-01:** un usuario de una sola sede no ve datos de otras sedes en ningún reporte.
- **CA-REP-02:** el inventario consolidado equivale a la suma por sede.
- **CA-REP-03:** las CxC por financiador reflejan `monto − cobrado` por financiamiento aprobado.
