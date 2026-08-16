# 14 — API REST

## 14.1 Principios

- REST versionada bajo `/api/v1/`.
- JSON en request y response. `Content-Type: application/json`.
- Autenticación con `Authorization: Bearer <access_token>`.
- Autorización por rol y **alcance de sede** en backend (RB-018).
- Documentación **OpenAPI/Swagger** en `/api/v1/docs` (protegida en producción).
- Nombres de recursos en plural y en español consistente con el negocio (`ventas`, `cotizaciones`), o en inglés técnico — **decisión:** rutas en **español** para alinear con el dominio y la BD (`/api/v1/ventas`). Los DTOs usan camelCase con `@map` en Prisma.

## 14.2 Formato de respuesta

Listados paginados:
```json
{
  "data": [ /* items */ ],
  "meta": { "page": 1, "pageSize": 20, "total": 137, "totalPages": 7 }
}
```
Recurso simple: el objeto directamente. Creación: `201` con el recurso creado.

## 14.3 Formato de error uniforme

```json
{
  "error": {
    "code": "SEDE_NO_AUTORIZADA",
    "message": "No tiene acceso a la sede solicitada.",
    "details": [],
    "requestId": "a1b2c3",
    "timestamp": "2026-01-01T12:00:00Z"
  }
}
```
Códigos HTTP: `400` validación, `401` no autenticado, `403` no autorizado/sede, `404` no encontrado, `409` conflicto (estado inválido, stock insuficiente), `422` regla de negocio, `429` rate limit, `500` interno.

## 14.4 Paginación, filtros, orden

Query params estándar:
- `page` (default 1), `pageSize` (default 20, máx 100).
- `sort` (`campo:asc|desc`), múltiples separados por coma.
- Filtros por campo: `estado=CONFIRMADA`, `sede_id=3`, `fecha_desde`, `fecha_hasta`, `q` (búsqueda de texto).
- `sede_id` en filtros se **valida** contra el alcance del usuario; si se omite y el usuario es multi-sede, se aplican todas sus sedes.

## 14.5 Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | credenciales → access + refresh |
| POST | `/api/v1/auth/refresh` | refresh → nuevo access |
| POST | `/api/v1/auth/logout` | revoca refresh |
| GET | `/api/v1/auth/me` | perfil, roles y sedes autorizadas |

## 14.6 Recursos principales (resumen de endpoints)

Convención CRUD: `GET /recurso`, `GET /recurso/:id`, `POST /recurso`, `PATCH /recurso/:id`, `DELETE /recurso/:id` (soft). Se listan endpoints no triviales.

### Sedes
`GET/POST/PATCH /api/v1/sedes`, `PATCH /api/v1/sedes/:id/principal` (marca principal, transaccional, auditado).

### Usuarios / Roles
`GET/POST/PATCH /api/v1/usuarios`, `PATCH /api/v1/usuarios/:id/sedes`, `PATCH /api/v1/usuarios/:id/roles`, `GET/POST/PATCH /api/v1/roles`, `GET /api/v1/permisos`.

### Catálogos
`/api/v1/categorias-producto`, `/api/v1/productos`, `/api/v1/servicios`, `PATCH /api/v1/servicios/:id/sedes` (disponibilidad/precio), `/api/v1/planes`, `/api/v1/proveedores`, `/api/v1/financiadores`, `/api/v1/metodos-pago`, `/api/v1/destinos-pago`.

### Inventario
- `GET /api/v1/inventarios?sede_id=&producto_id=` — stock por sede.
- `GET /api/v1/inventarios/stock-bajo?sede_id=` — alertas.
- `GET /api/v1/inventarios/kardex?sede_id=&producto_id=&desde=&hasta=` — kardex.
- `POST /api/v1/inventarios/ajustes` — ajuste/merma (tipo, cantidad, motivo).

### Compras
- `POST /api/v1/compras` (BORRADOR), `POST /api/v1/compras/:id/recepcionar` (transacción, efecto inventario), `POST /api/v1/compras/:id/anular`.

### Transferencias
- `POST /api/v1/transferencias`, `POST /:id/aprobar`, `POST /:id/enviar` (salida), `POST /:id/recibir` (entrada), `POST /:id/cancelar`.

### Ventas
- `POST /api/v1/ventas` — crea venta con detalle y financiamientos (transacción, descuenta stock).
- `GET /api/v1/ventas`, `GET /:id`.
- `POST /api/v1/ventas/:id/anular` — reversión.
- `GET /api/v1/ventas/:id/estado-cuenta` — total, financiado, cobrado, por cobrar.

### Cotizaciones
- `POST /api/v1/public/cotizaciones` — pública (rate limit + captcha).
- `GET /api/v1/cotizaciones`, `POST /:id/asignar`, `PATCH /:id/estado`, `POST /:id/convertir-venta`.

### Financiamiento / CxC
- `GET /api/v1/financiamientos?estado=&financiador_id=`.
- `PATCH /api/v1/financiamientos/:id/estado` (DOCUMENTADA→ENVIADA→APROBADA...).
- `GET /api/v1/cuentas-por-cobrar?financiador_id=&sede_id=&antiguedad=` — saldos pendientes.

### Pagos
- `POST /api/v1/pagos` — registra pago aplicado a un financiamiento (valida efectivo/caja o electrónico/destino).
- `POST /api/v1/pagos/:id/anular`.
- `GET /api/v1/pagos?venta_id=&sede_cobro_id=&metodo=`.

### Caja
- `POST /api/v1/cajas/:id/aperturas` (apertura), `POST /api/v1/aperturas-caja/:id/movimientos`, `POST /api/v1/aperturas-caja/:id/cerrar` (arqueo), `GET /api/v1/aperturas-caja/:id/resumen`.

### Reportes
- `GET /api/v1/reportes/ventas?sede_id=&desde=&hasta=`
- `GET /api/v1/reportes/inventario-consolidado`
- `GET /api/v1/reportes/cxc-por-financiador`
- `GET /api/v1/reportes/flujo-efectivo?sede_id=`
- `GET /api/v1/reportes/metodos-pago`, etc. Todos con `?formato=json|csv|xlsx|pdf`.

### Auditoría
- `GET /api/v1/auditoria?entidad=&entidad_id=&usuario_id=&desde=&hasta=`.

### Público (lectura)
- `GET /api/v1/public/servicios`, `/public/productos`, `/public/planes`, `/public/promociones`, `/public/sedes`, `/public/faq`.

## 14.7 Reglas de autorización por endpoint (ejemplos)

| Endpoint | Roles permitidos | Validación de sede |
|---|---|---|
| `POST /ventas` | vendedor, admin_sede, admin_corporativo | `sede_venta_id` ∈ sedes del usuario |
| `POST /compras` | admin_corporativo, admin_sede(principal) | sede = principal |
| `POST /transferencias/:id/recibir` | encargado_inventario, admin_sede | usuario tiene acceso a `sede_destino_id` |
| `POST /pagos` | vendedor, encargado_caja, admin_sede | `sede_cobro_id` ∈ sedes del usuario |
| `GET /reportes/*consolidado*` | admin_corporativo, supervisor multi-sede | acceso total |

## 14.8 Idempotencia y concurrencia

- Operaciones de confirmación (recepción de compra/transferencia, confirmación de venta) aceptan header `Idempotency-Key` opcional para evitar dobles envíos.
- Actualización de stock usa bloqueo optimista/transacción con `SELECT ... FOR UPDATE` sobre la fila de `inventarios` correspondiente para evitar condiciones de carrera (RB-025).

## 14.9 Versionado

- Prefijo `/api/v1`. Cambios incompatibles → `/api/v2`. Cambios aditivos permanecen en v1. Deprecaciones anunciadas vía cabecera `Deprecation` y documentación.

## 14.10 OpenAPI

- Generar spec con `@nestjs/swagger` desde DTOs y decoradores. Servir en `/api/v1/docs`. Exportar `openapi.json` como artefacto de CI para clientes y para que Claude Code genere tipos del frontend.
