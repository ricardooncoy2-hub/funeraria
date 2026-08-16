# 04 — Requisitos Funcionales

Cada requisito es verificable. Los criterios de aceptación detallados están en [36](36_criterios_aceptacion.md).

## 4.1 Autenticación y usuarios

- **RF-001** El sistema debe autenticar usuarios con correo/usuario y contraseña, emitiendo un JWT de acceso y un refresh token.
- **RF-002** El sistema debe permitir renovar el token de acceso mediante el refresh token.
- **RF-003** El sistema debe permitir cerrar sesión invalidando el refresh token.
- **RF-004** El sistema debe almacenar contraseñas con hash seguro (argon2id o bcrypt, ver [16](16_seguridad.md)).
- **RF-005** El sistema debe permitir crear, editar, activar/desactivar (soft) usuarios.
- **RF-006** El sistema debe asignar a un usuario uno o más roles y una o más sedes.
- **RF-007** El sistema debe soportar usuarios corporativos con acceso a todas las sedes.
- **RF-008** El sistema debe forzar cambio de contraseña en el primer inicio de sesión (configurable).

## 4.2 Roles y permisos (RBAC)

- **RF-010** El sistema debe gestionar roles y permisos.
- **RF-011** Cada permiso debe evaluarse junto con el **alcance de sede** del usuario.
- **RF-012** El backend debe validar autorización en cada endpoint protegido.
- **RF-013** El sistema debe registrar en auditoría los cambios de roles/permisos.

## 4.3 Sedes

- **RF-020** El sistema debe permitir crear, editar y desactivar sedes.
- **RF-021** El sistema debe identificar explícitamente **una** sede principal (`is_main = true`) y garantizar que exista exactamente una activa.
- **RF-022** El sistema debe impedir eliminar físicamente una sede con operaciones asociadas.

## 4.4 Catálogos maestros

- **RF-030** El sistema debe gestionar **categorías de producto** y **productos** en un catálogo maestro único (no duplicado por sede).
- **RF-031** El sistema debe gestionar **servicios** funerarios y su disponibilidad por sede.
- **RF-032** El sistema debe permitir precio corporativo del servicio y **precio específico por sede** (override).
- **RF-033** El sistema debe gestionar **planes/paquetes** compuestos por productos y servicios.
- **RF-034** El sistema debe permitir conocer los componentes de un plan y calcular disponibilidad por sede.
- **RF-035** El sistema debe gestionar **proveedores**.
- **RF-036** El sistema debe gestionar **financiadores** (cliente, SIS, EsSalud, aseguradoras, instituciones, convenios).

## 4.5 Inventario

- **RF-040** El sistema debe mantener inventario por sede (`inventarios`) con stock actual, mínimo, máximo y costo promedio.
- **RF-041** El sistema debe garantizar unicidad de `(sede_id, producto_id)` en inventario.
- **RF-042** Todo cambio de stock debe generar un **movimiento de inventario** con stock anterior y posterior.
- **RF-043** El sistema debe reconstruir el **kardex** de un producto por sede a partir de los movimientos.
- **RF-044** El sistema debe alertar cuando el stock actual sea menor o igual al stock mínimo.
- **RF-045** El sistema debe permitir ajustes de entrada/salida y mermas con motivo obligatorio.

## 4.6 Compras (centralizadas)

- **RF-050** El sistema debe registrar compras a proveedores **asociadas a la sede principal**.
- **RF-051** Una compra confirmada debe incrementar el inventario de la sede principal (movimiento tipo `COMPRA`).
- **RF-052** El sistema debe recalcular el **costo promedio** del producto en la sede principal al recepcionar la compra.
- **RF-053** El sistema debe registrar proveedor, documento, ítems, cantidades, costos, impuestos, total, usuario y estado.
- **RF-054** Las sedes provinciales **no** pueden crear compras salvo que se habilite por configuración (deshabilitado por defecto).

## 4.7 Transferencias entre sedes

- **RF-060** El sistema debe permitir transferir productos desde la sede principal a otras sedes.
- **RF-061** Una transferencia debe seguir estados: `SOLICITADA → APROBADA → ENVIADA → RECIBIDA` (o `CANCELADA`).
- **RF-062** Al confirmar el envío, el sistema debe generar salida (`TRANSFERENCIA_SALIDA`) en la sede origen.
- **RF-063** Al confirmar la recepción, el sistema debe generar entrada (`TRANSFERENCIA_ENTRADA`) en la sede destino.
- **RF-064** El sistema debe garantizar consistencia mediante transacción de base de datos (RB-017).
- **RF-065** El sistema debe impedir transferir más cantidad que el stock disponible en origen.

## 4.8 Clientes

- **RF-070** El sistema debe gestionar clientes con tipo/número de documento, nombres, apellidos, teléfono, correo, dirección (opcional) y estado.
- **RF-071** El sistema debe evitar duplicados por `(tipo_documento, numero_documento)`.
- **RF-072** El sistema debe aplicar minimización de datos (ver [17](17_proteccion_datos.md)).

## 4.9 Cotizaciones

- **RF-080** El sitio público debe permitir crear cotizaciones (origen `WEB`).
- **RF-081** El admin debe permitir crear cotizaciones de otros orígenes (`WHATSAPP`, `TELEFONO`, `PRESENCIAL`, `OTRO`).
- **RF-082** Una cotización debe poder contener productos, servicios y/o un plan, con observaciones y sede preferida.
- **RF-083** El sistema debe gestionar estados de cotización (ver [23](23_cotizaciones.md)).
- **RF-084** El sistema debe permitir **asignar** una cotización web a una sede para atención.
- **RF-085** El sistema debe permitir **convertir** una cotización aceptada en una venta.
- **RF-086** El sistema debe marcar cotizaciones **vencidas** según fecha de validez (tarea programada).

## 4.10 Ventas

- **RF-090** El sistema debe registrar ventas asociadas a una **sede de venta** (`sede_venta_id`).
- **RF-091** Una venta puede contener productos, servicios, planes y descuentos.
- **RF-092** El sistema debe calcular subtotal, descuento, impuestos y total.
- **RF-093** Al confirmar una venta con productos, el sistema debe descontar stock de la **sede de venta** (movimiento `VENTA`).
- **RF-094** El sistema debe crear el/los **financiamientos** de la venta (cliente y/o instituciones) cuya suma iguale el total.
- **RF-095** El sistema debe permitir anular una venta con reversión de inventario y trazabilidad (no eliminación física).
- **RF-096** Para operaciones funerarias, el sistema debe permitir crear un **servicio contratado** vinculado a la venta (ver [20](20_ventas.md)).

## 4.11 Financiamiento y cuentas por cobrar

- **RF-100** El sistema debe registrar uno o varios **financiamientos** por venta, cada uno asociado a un financiador.
- **RF-101** El sistema debe registrar coberturas con monto autorizado, utilizado y pendiente.
- **RF-102** El sistema debe calcular, por venta y por financiador: total, cobrado y pendiente.
- **RF-103** El sistema debe gestionar estados de financiamiento (ver [21](21_financiamiento.md)).
- **RF-104** El sistema debe listar cuentas por cobrar por financiador/aseguradora, con antigüedad.
- **RF-105** Al recibir un pago de un financiador, el sistema debe reducir su saldo pendiente.

## 4.12 Pagos

- **RF-110** El sistema debe registrar múltiples pagos por venta.
- **RF-111** Cada pago debe aplicarse a un **financiamiento** específico (define a quién se le cobra).
- **RF-112** Cada pago debe registrar **método de pago** y **destino del dinero** (separados).
- **RF-113** Un pago en efectivo debe generar un **movimiento de caja** en la sede de cobro.
- **RF-114** Un pago electrónico (POS, transferencia, Yape/Plin) **no** debe generar movimiento de caja física.
- **RF-115** El sistema debe registrar la **sede de cobro** (que puede diferir de la sede de venta).
- **RF-116** El sistema debe impedir que la suma de pagos aplicados a un financiamiento supere su monto (salvo excedentes configurados).

## 4.13 Cajas

- **RF-120** El sistema debe gestionar cajas por sede.
- **RF-121** El sistema debe permitir apertura de caja con saldo inicial.
- **RF-122** El sistema debe registrar ingresos, egresos, ventas en efectivo y retiros.
- **RF-123** El sistema debe calcular saldo esperado, permitir registrar saldo contado y calcular diferencia al cierre.
- **RF-124** El sistema debe impedir registrar movimientos de efectivo sin caja abierta.
- **RF-125** El sistema debe impedir dos aperturas simultáneas de la misma caja.

## 4.14 Reportes

- **RF-130** El sistema debe generar reportes por sede: ventas, productos/servicios vendidos, inventario, kardex, stock bajo, compras, transferencias, caja, pagos, CxC, financiamientos.
- **RF-131** El sistema debe generar reportes consolidados corporativos.
- **RF-132** Todo reporte debe respetar el alcance de sede del usuario.
- **RF-133** El sistema debe permitir exportar reportes (CSV/Excel/PDF).

## 4.15 Auditoría

- **RF-140** El sistema debe registrar eventos críticos (login, CRUD, cambios de estado, ventas, anulaciones, movimientos de inventario, transferencias, compras, pagos, caja, cambios de permisos).
- **RF-141** Cada registro de auditoría debe incluir usuario, acción, entidad, id de registro, fecha, IP y datos relevantes.

## 4.16 Sitio público

- **RF-150** El sitio debe mostrar inicio, nosotros, servicios, productos, planes, promociones, sedes, contacto, FAQ y formulario de cotización.
- **RF-151** El sitio debe ofrecer contacto directo por WhatsApp con mensaje prellenado.
- **RF-152** El sitio debe estar optimizado para SEO, mobile y performance (ver [32](32_seo.md)).
- **RF-153** El formulario de cotización debe tener protección anti-spam (rate limit + captcha) y consentimiento de datos.
