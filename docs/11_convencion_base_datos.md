# 11 — Convención de Base de Datos

Estas convenciones son **obligatorias** para la base de datos **MariaDB 11.8**. Prisma puede usar nombres idiomáticos en TypeScript mediante `@map`/`@@map`, pero **el esquema físico de la base de datos respeta estrictamente estas reglas**.

## 11.1 Reglas de nomenclatura

- `snake_case`, todo en **minúsculas**.
- Sin tildes, sin `ñ`, sin espacios, sin caracteres especiales.
- **Tablas en plural** y descriptivas: `sedes`, `ventas`, `movimientos_inventario`.
- Tablas puente/N:M: combinación singular ordenada: `usuario_sede`, `rol_permiso`, `usuario_rol`.
- Tablas de detalle: `detalle_<entidad>`: `detalle_venta`, `detalle_compra`, `detalle_cotizacion`, `detalle_transferencia_inventario`.
- Evitar abreviaturas ambiguas (`cliente_id`, no `cli_id`).

## 11.2 Claves

- **PK:** siempre `id` (`BIGINT UNSIGNED AUTO_INCREMENT`).
- **FK:** `<entidad_singular>_id`: `sede_id`, `producto_id`, `usuario_id`, `cliente_id`, `venta_id`, `financiamiento_id`.
- FK con rol semántico específico: prefijo de rol + entidad: `sede_venta_id`, `sede_cobro_id`, `sede_origen_id`, `sede_destino_id`, `sede_administradora_id`, `usuario_solicita_id`.

## 11.3 Columnas estándar

- Fechas de auditoría: `created_at`, `updated_at`, `deleted_at` (soft delete, NULL = activo).
- Tablas de eventos inmutables (`movimientos_inventario`, `movimientos_caja`, `auditoria`): solo `created_at` (sin `updated_at`/`deleted_at`).
- Booleanos: `is_active`, `is_main`, `es_corporativo`, `es_efectivo`, `afecto_igv`, `disponible`. Tipo `TINYINT(1)`.
- Estados: columna `estado` `VARCHAR`, con valores documentados y `CHECK` cuando aporte.

## 11.4 Tipos de datos

| Concepto | Tipo MariaDB |
|---|---|
| Identificadores | `BIGINT UNSIGNED` |
| Montos | `DECIMAL(12,2)` |
| Cantidades | `DECIMAL(12,3)` |
| Porcentajes | `DECIMAL(5,2)` |
| Textos cortos | `VARCHAR(n)` |
| Textos largos | `TEXT` |
| Fechas con hora | `DATETIME` (UTC) |
| Solo fecha | `DATE` |
| Booleanos | `TINYINT(1)` |
| Datos flexibles | `JSON` (solo `auditoria.datos`, coberturas metadata) |

Charset `utf8mb4`, collation `utf8mb4_uca1400_ai_ci` (o `utf8mb4_general_ci`; **no** `utf8mb4_0900_ai_ci`, exclusiva de MySQL 8 — ver ADR-002), motor **InnoDB**.

## 11.5 Restricciones

Usar siempre que aporten integridad:
- `PRIMARY KEY` en `id`.
- `FOREIGN KEY` con `ON UPDATE CASCADE` y `ON DELETE RESTRICT` por defecto (no destruir trazabilidad, RB-020). Excepciones documentadas (p. ej. detalle → cabecera puede ser `ON DELETE CASCADE` **solo** en borradores no confirmados; en confirmados se usa soft delete).
- `UNIQUE` donde corresponda:
  - `sedes.codigo`, `sedes.is_main_flag`.
  - `usuarios.correo`, `usuarios.usuario`.
  - `productos.codigo`, `servicios.codigo`, `planes.codigo`.
  - `inventarios (sede_id, producto_id)`.
  - `sede_servicio (sede_id, servicio_id)`.
  - `usuario_sede (usuario_id, sede_id)`, `usuario_rol (usuario_id, rol_id)`, `rol_permiso (rol_id, permiso_id)`.
  - `clientes (tipo_documento, numero_documento)`, `proveedores (tipo_documento, numero_documento)`.
  - `ventas.codigo`, `compras`... correlativos según serie.
- `NOT NULL` en columnas requeridas.
- `CHECK` (MariaDB los aplica desde 10.2): `stock_actual >= 0`, `monto > 0` en pagos, `sede_origen_id <> sede_destino_id`, coherencia de `origen_tipo`/`item_tipo` con sus FKs.

## 11.6 Índices (guía; detalle en [45 del prompt])

Crear índices para: todas las FK, `sede_id`, columnas de `fecha`, `estado`, `productos.codigo`, `clientes.numero_documento`, `clientes.correo`, compuestos `(sede_id, fecha)`, `(sede_id, producto_id)`, `financiador_id`, y estado de cobranza. Evitar índices redundantes. Documentar índices no obvios en el esquema Prisma con `@@index`.

## 11.7 Correlativos y códigos

- Correlativos de documentos (`ventas.codigo`, `compras`, `transferencias_inventario.codigo`, `cotizaciones.codigo`) se generan en el service dentro de la transacción, con formato `<PREFIJO>-<SEDE>-<AÑO>-<NNNNNN>` (p. ej. `V-CARAZ-2026-000123`). Evitar depender solo de `AUTO_INCREMENT` para códigos visibles.

## 11.8 Ejemplos de mapeo Prisma → MariaDB

> **Datasource:** en `schema.prisma`, `provider = "mysql"` (Prisma usa el mismo proveedor para MySQL y MariaDB) y en el cliente se inyecta el adapter `@prisma/adapter-mariadb`. La `DATABASE_URL` usa esquema `mysql://usuario:clave@host:3306/base`.

```prisma
model InventoryMovement {
  id              BigInt   @id @default(autoincrement()) @db.UnsignedBigInt
  sedeId          BigInt   @map("sede_id") @db.UnsignedBigInt
  productoId      BigInt   @map("producto_id") @db.UnsignedBigInt
  tipo            String   @db.VarChar(24)
  cantidad        Decimal  @db.Decimal(12, 3)
  stockAnterior   Decimal  @map("stock_anterior") @db.Decimal(12, 3)
  stockPosterior  Decimal  @map("stock_posterior") @db.Decimal(12, 3)
  createdAt       DateTime @default(now()) @map("created_at")

  sede     Branch   @relation(fields: [sedeId], references: [id])
  producto Product  @relation(fields: [productoId], references: [id])

  @@index([sedeId, productoId, createdAt])
  @@map("movimientos_inventario")
}
```

El modelo TypeScript `InventoryMovement` se mapea a la tabla `movimientos_inventario` y sus columnas snake_case, cumpliendo ambas convenciones simultáneamente (ADR-003).

## 11.9 Reglas prohibidas

- ❌ `productos.stock` como fuente de inventario (usar `inventarios`).
- ❌ Nombres con mayúsculas/tildes/`ñ`/espacios en la base de datos.
- ❌ Eliminación física de tablas transaccionales críticas.
- ❌ FK con `ON DELETE CASCADE` hacia registros históricos confirmados.
