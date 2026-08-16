# 12 — Diagrama Entidad-Relación (ERD)

Diagrama lógico. Atributos completos en [10](10_modelo_datos.md). Se muestran claves y relaciones principales.

## 12.1 ERD — Núcleo corporativo y usuarios

```mermaid
erDiagram
  sedes ||--o{ usuario_sede : "tiene"
  usuarios ||--o{ usuario_sede : "accede"
  usuarios ||--o{ usuario_rol : ""
  roles ||--o{ usuario_rol : ""
  roles ||--o{ rol_permiso : ""
  permisos ||--o{ rol_permiso : ""
  roles ||--o{ usuario_sede : "rol por sede"
  usuarios ||--o{ refresh_tokens : ""

  sedes {
    bigint id PK
    varchar codigo UK
    varchar nombre
    tinyint is_main
    tinyint is_active
  }
  usuarios {
    bigint id PK
    varchar correo UK
    tinyint es_corporativo
    tinyint is_active
  }
  usuario_sede {
    bigint id PK
    bigint usuario_id FK
    bigint sede_id FK
    bigint rol_id FK
  }
  roles { bigint id PK  varchar codigo UK }
  permisos { bigint id PK  varchar codigo UK }
```

## 12.2 ERD — Catálogos

```mermaid
erDiagram
  categorias_producto ||--o{ productos : "clasifica"
  planes ||--o{ plan_items : "compone"
  productos ||--o{ plan_items : ""
  servicios ||--o{ plan_items : ""
  sedes ||--o{ sede_servicio : ""
  servicios ||--o{ sede_servicio : ""

  productos { bigint id PK  varchar codigo UK  decimal precio_venta }
  servicios { bigint id PK  varchar codigo UK  decimal precio_base }
  planes { bigint id PK  varchar codigo UK  decimal precio }
  sede_servicio { bigint id PK  bigint sede_id FK  bigint servicio_id FK  decimal precio }
```

## 12.3 ERD — Inventario, compras y transferencias

```mermaid
erDiagram
  sedes ||--o{ inventarios : ""
  productos ||--o{ inventarios : ""
  sedes ||--o{ movimientos_inventario : ""
  productos ||--o{ movimientos_inventario : ""
  proveedores ||--o{ compras : ""
  sedes ||--o{ compras : "principal"
  compras ||--o{ detalle_compra : ""
  productos ||--o{ detalle_compra : ""
  sedes ||--o{ transferencias_inventario : "origen/destino"
  transferencias_inventario ||--o{ detalle_transferencia_inventario : ""
  productos ||--o{ detalle_transferencia_inventario : ""

  inventarios {
    bigint id PK
    bigint sede_id FK
    bigint producto_id FK
    decimal stock_actual
    decimal costo_promedio
  }
  movimientos_inventario {
    bigint id PK
    bigint sede_id FK
    bigint producto_id FK
    varchar tipo
    decimal cantidad
    decimal stock_anterior
    decimal stock_posterior
  }
  transferencias_inventario {
    bigint id PK
    bigint sede_origen_id FK
    bigint sede_destino_id FK
    varchar estado
  }
```

## 12.4 ERD — Ventas, financiamiento y pagos (núcleo del negocio)

```mermaid
erDiagram
  clientes ||--o{ ventas : ""
  sedes ||--o{ ventas : "sede_venta"
  usuarios ||--o{ ventas : "vendedor"
  ventas ||--o{ detalle_venta : ""
  ventas ||--o{ servicios_contratados : ""
  ventas ||--o{ financiamientos : "1..N"
  clientes ||--o{ financiamientos : "cliente"
  financiadores ||--o{ financiamientos : "institucion"
  financiamientos ||--o{ pagos : "aplica"
  ventas ||--o{ pagos : "consulta"
  metodos_pago ||--o{ pagos : ""
  destinos_pago ||--o{ pagos : ""
  sedes ||--o{ pagos : "sede_cobro"
  aperturas_caja ||--o{ pagos : "efectivo"

  ventas {
    bigint id PK
    varchar codigo UK
    bigint sede_venta_id FK
    bigint cliente_id FK
    decimal total
    varchar estado
  }
  financiamientos {
    bigint id PK
    bigint venta_id FK
    varchar origen_tipo
    bigint cliente_id FK
    bigint financiador_id FK
    decimal monto
    varchar estado
  }
  pagos {
    bigint id PK
    bigint financiamiento_id FK
    bigint venta_id FK
    decimal monto
    bigint metodo_pago_id FK
    bigint destino_pago_id FK
    bigint sede_cobro_id FK
    bigint apertura_caja_id FK
  }
```

## 12.5 ERD — Caja

```mermaid
erDiagram
  sedes ||--o{ cajas : ""
  cajas ||--o{ aperturas_caja : ""
  aperturas_caja ||--o{ movimientos_caja : ""
  pagos ||--o{ movimientos_caja : "efectivo"
  usuarios ||--o{ aperturas_caja : ""

  cajas { bigint id PK  bigint sede_id FK  varchar nombre }
  aperturas_caja {
    bigint id PK
    bigint caja_id FK
    decimal saldo_inicial
    decimal saldo_esperado
    decimal saldo_contado
    varchar estado
  }
  movimientos_caja {
    bigint id PK
    bigint apertura_caja_id FK
    varchar tipo
    decimal monto
    bigint pago_id FK
  }
```

## 12.6 ERD — Cotizaciones

```mermaid
erDiagram
  cotizaciones ||--o{ detalle_cotizacion : ""
  sedes ||--o{ cotizaciones : "preferida/asignada"
  clientes ||--o{ cotizaciones : ""
  planes ||--o{ cotizaciones : ""
  cotizaciones ||--o{ ventas : "convierte"

  cotizaciones {
    bigint id PK
    varchar codigo UK
    varchar origen
    varchar estado
    bigint sede_asignada_id FK
  }
```

## 12.7 Relaciones clave a recordar

- `ventas.sede_venta_id` ≠ `pagos.sede_cobro_id` (RB-007, ADR-009).
- `pagos.financiamiento_id` conecta el dinero con la obligación (ADR-010).
- `financiamientos` suma = `ventas.total` (RB-021).
- `movimientos_inventario` es la fuente del kardex; `inventarios.stock_actual` es el saldo materializado.
- `destinos_pago.sede_administradora_id` modela dónde "cae" el dinero electrónico (RB-009).
