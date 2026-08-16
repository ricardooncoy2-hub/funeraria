# 25 — Auditoría

## 25.1 Objetivo

Registrar eventos relevantes para trazabilidad, seguridad y cumplimiento (Ley 29733). La auditoría permite conocer **quién** hizo **qué**, sobre **qué entidad**, **cuándo** y desde **dónde**.

## 25.2 Eventos auditados

Login, logout, creación, modificación, eliminación lógica, cambio de estado, venta, anulación de venta, movimiento de inventario, transferencia, compra, pago, apertura de caja, cierre de caja, ajustes, cambios de permisos, accesos denegados relevantes.

Códigos de acción (`auditoria.accion`): `LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `STATE_CHANGE`, `SALE`, `SALE_VOID`, `INVENTORY_MOVE`, `TRANSFER`, `PURCHASE`, `PAYMENT`, `PAYMENT_VOID`, `CASH_OPEN`, `CASH_CLOSE`, `ADJUSTMENT`, `PERMISSION_CHANGE`, `ACCESS_DENIED`.

## 25.3 Datos registrados

| Campo | Contenido |
|---|---|
| `usuario_id` | actor (NULL si sistema/anónimo) |
| `accion` | código de acción |
| `entidad` | tabla/recurso afectado |
| `entidad_id` | id del registro |
| `sede_id` | contexto de sede |
| `ip` | IP de origen |
| `datos` | JSON con valores relevantes / diff (antes/después), sin datos sensibles innecesarios |
| `created_at` | timestamp inmutable |

## 25.4 Mecanismo

- **Interceptor `AuditInterceptor`** para endpoints marcados con `@Audit('ACCION')`: registra automáticamente tras respuesta exitosa.
- **`AuditService.record(...)`** invocado explícitamente por services en eventos de dominio complejos (dentro de la misma transacción cuando la consistencia lo requiere, o inmediatamente después).
- Los movimientos específicos (`movimientos_inventario`, `movimientos_caja`) complementan la auditoría con detalle operativo.

## 25.5 Diffs y privacidad

- `datos` guarda solo campos relevantes. Se **enmascaran** o excluyen contraseñas, tokens y números completos de cuenta.
- Para datos personales, se registra el hecho del acceso/cambio, no necesariamente el contenido íntegro.

## 25.6 Inmutabilidad y retención

- `auditoria` es **append-only**: sin `update`/`delete` desde la aplicación.
- Retención según política (p. ej. ≥ 12 meses; los eventos ligados a transacciones contables siguen la retención de éstas).
- Considerar archivado de auditoría antigua a almacenamiento frío si el volumen crece.

## 25.7 Consulta

`GET /api/v1/auditoria?entidad=&entidad_id=&usuario_id=&accion=&sede_id=&desde=&hasta=` — restringido a `auditoria.leer`; `admin_sede` ve su(s) sede(s), corporativo ve todo.

## 25.8 Relación con anulaciones

Toda anulación/cancelación/reversión (venta, pago, compra) deja registro en `auditoria` **y** el efecto operativo (movimiento de reversión), garantizando que ninguna operación crítica desaparezca (RB-020).

## 25.9 Criterios de aceptación

- **CA-AUD-01:** cada venta, pago, anulación, transferencia, compra y cambio de permisos genera un registro de auditoría con actor, entidad y timestamp.
- **CA-AUD-02:** los registros de auditoría no pueden modificarse ni borrarse desde la aplicación.
