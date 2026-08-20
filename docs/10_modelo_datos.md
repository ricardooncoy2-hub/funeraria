# 10 — Modelo de Datos

Base de datos: **MariaDB 11.8 LTS** (motor InnoDB, charset `utf8mb4`, collation `utf8mb4_uca1400_ai_ci` — o `utf8mb4_general_ci`; **no** `utf8mb4_0900_ai_ci`, que es exclusiva de MySQL 8). ORM: **Prisma** (datasource `provider = "mysql"` + adapter `@prisma/adapter-mariadb`). Nomenclatura obligatoria en [11](11_convencion_base_datos.md). Ver ADR-002 en [34](34_decisiones_arquitectonicas.md).

Convenciones aplicadas a todas las tablas salvo indicación:
- PK: `id` `BIGINT UNSIGNED AUTO_INCREMENT`.
- FK: `<entidad_singular>_id`.
- Auditoría de fila: `created_at DATETIME`, `updated_at DATETIME`, `deleted_at DATETIME NULL` (soft delete donde aplique).
- Booleanos: `is_...` `TINYINT(1)`.
- Montos: `DECIMAL(12,2)`. Cantidades: `DECIMAL(12,3)` (permite fracciones si algún producto se maneja por peso; enteros para unidades).
- Estados/tipos: `VARCHAR` con `CHECK` o enum de aplicación (Prisma enum → `VARCHAR` en la BD vía `@map`). Se documentan valores permitidos.
- **Columnas JSON** (p. ej. `auditoria.datos`): en MariaDB `JSON` es internamente `LONGTEXT` con `CHECK (json_valid(col))`. Funciona con las funciones JSON estándar; no se hace indexación JSON intensiva, por lo que es suficiente.

---

## 10.1 Corporativo — Empresa y configuración

### `configuracion_empresa`
Fila única (id=1) con parámetros globales.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| razon_social | VARCHAR(200) | |
| nombre_comercial | VARCHAR(200) | "Funeraria Minaya" |
| ruc | VARCHAR(11) | |
| direccion_fiscal | VARCHAR(255) | |
| telefono | VARCHAR(30) | |
| correo | VARCHAR(150) | |
| igv_porcentaje | DECIMAL(5,2) | default 18.00 |
| moneda | VARCHAR(3) | default 'PEN' |
| compras_descentralizadas | TINYINT(1) | default 0 (RB-001) |
| logo_url | VARCHAR(500) | S3 |
| created_at / updated_at | DATETIME | |

## 10.2 Corporativo — Sedes

### `sedes`
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| codigo | VARCHAR(20) | UNIQUE, p.ej. 'PRIN','CARAZ' |
| nombre | VARCHAR(150) | |
| descripcion | VARCHAR(500) NULL | |
| direccion | VARCHAR(255) NULL | calle/número, texto libre |
| distrito_id | BIGINT UNSIGNED NULL | FK `distritos.id` `ON DELETE RESTRICT`; departamento/provincia se derivan por la cadena `distrito → provincia → departamento` (ver §10.2.1, ADR-019) |
| telefono | VARCHAR(30) NULL | |
| correo | VARCHAR(150) NULL | |
| is_active | TINYINT(1) | default 1 |
| is_main | TINYINT(1) | default 0 |
| is_main_flag | TINYINT(1) generada | `= 1 IF is_main ELSE NULL`; `UNIQUE` para forzar única principal (RB-024) |
| created_at / updated_at / deleted_at | DATETIME | |

## 10.2.1 Catálogo de ubigeo (departamento/provincia/distrito)

Catálogo normalizado y de solo lectura, poblado por seed desde datos INEI/RENIEC (ver ADR-019), reutilizado por toda entidad que registre una ubicación (`sedes`, `clientes`, `proveedores`; ver §10.5). Cada entidad guarda un único FK `distrito_id` — nunca texto libre ni los tres niveles por separado — por lo que es imposible persistir una combinación departamento/provincia/distrito inconsistente.

### `departamentos`
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| codigo | VARCHAR(2) | UNIQUE, código INEI (p. ej. '01') |
| nombre | VARCHAR(100) | |

### `provincias`
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| codigo | VARCHAR(4) | código INEI (p. ej. '0101'); `UNIQUE(departamento_id, codigo)` |
| nombre | VARCHAR(100) | |
| departamento_id | BIGINT UNSIGNED | FK `departamentos.id` `ON DELETE RESTRICT` |

### `distritos`
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| codigo | VARCHAR(6) | UNIQUE, código INEI (p. ej. '010101') |
| nombre | VARCHAR(100) | |
| provincia_id | BIGINT UNSIGNED | FK `provincias.id` `ON DELETE RESTRICT` |

> Fuente de datos: `jmcastagnetto/ubigeo-peru-aumentado` (MIT). 25 departamentos / 196 provincias / 1892 distritos. Es una foto de datos en el tiempo — si el INEI crea distritos nuevos, requiere re-seed puntual (ver ADR-019, sección Consecuencias).

Restricciones: `UNIQUE(codigo)`, `UNIQUE(is_main_flag)`. Validación transaccional adicional al cambiar la principal.

## 10.3 Corporativo — Usuarios, roles, permisos

### `usuarios`
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| nombres | VARCHAR(150) | |
| apellidos | VARCHAR(150) | |
| correo | VARCHAR(150) | UNIQUE |
| usuario | VARCHAR(60) | UNIQUE (login alterno) |
| password_hash | VARCHAR(255) | argon2id/bcrypt |
| telefono | VARCHAR(30) NULL | |
| es_corporativo | TINYINT(1) | default 0 (acceso a todas las sedes) |
| is_active | TINYINT(1) | default 1 |
| must_change_password | TINYINT(1) | default 1 |
| ultimo_login_at | DATETIME NULL | |
| created_at / updated_at / deleted_at | DATETIME | |

### `roles`
| id | codigo (UNIQUE: admin_corporativo, admin_sede, vendedor, encargado_inventario, encargado_caja, supervisor, consulta) | nombre | descripcion | is_active | timestamps |

### `permisos`
| id | codigo (UNIQUE, p.ej. `ventas.crear`, `inventario.ajustar`, `sede.acceso_total`) | nombre | modulo | descripcion | timestamps |

### `rol_permiso` (N:M)
| id | rol_id FK | permiso_id FK | UNIQUE(rol_id, permiso_id) |

### `usuario_rol` (N:M)
| id | usuario_id FK | rol_id FK | UNIQUE(usuario_id, rol_id) |

### `usuario_sede` (N:M, alcance de sede)
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT UNSIGNED PK | |
| usuario_id | FK usuarios | |
| sede_id | FK sedes | |
| rol_id | FK roles NULL | rol específico en esa sede (opcional) |
| is_active | TINYINT(1) | |
| timestamps | | |
| | | `UNIQUE(usuario_id, sede_id)` |

> `es_corporativo=1` o permiso `sede.acceso_total` implican acceso a todas las sedes activas sin filas en `usuario_sede`.

### `refresh_tokens`
| id | usuario_id FK | token_hash VARCHAR(255) | expires_at DATETIME | revoked_at DATETIME NULL | user_agent VARCHAR(255) | ip VARCHAR(45) | created_at |

## 10.4 Corporativo — Catálogos

### `categorias_producto`
| id | nombre VARCHAR(120) UNIQUE | descripcion | is_active | timestamps |

### `productos` (catálogo maestro, sin stock)
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| codigo | VARCHAR(40) UNIQUE | SKU |
| nombre | VARCHAR(200) | |
| descripcion | TEXT NULL | |
| categoria_producto_id | FK | |
| unidad_medida | VARCHAR(20) | 'UNIDAD','PAR', etc. |
| precio_venta | DECIMAL(12,2) | precio corporativo de venta |
| afecto_igv | TINYINT(1) | default 1 |
| imagen_url | VARCHAR(500) NULL | S3 |
| is_active | TINYINT(1) | |
| timestamps + deleted_at | | |

### `servicios`
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| codigo | VARCHAR(40) UNIQUE | |
| nombre | VARCHAR(200) | |
| descripcion | TEXT NULL | |
| precio_base | DECIMAL(12,2) | corporativo |
| afecto_igv | TINYINT(1) | |
| imagen_url | VARCHAR(500) NULL | S3 |
| is_active | TINYINT(1) | |
| timestamps + deleted_at | | |

### `sede_servicio` (disponibilidad/precio por sede)
| id | sede_id FK | servicio_id FK | disponible TINYINT(1) | precio DECIMAL(12,2) NULL (override, RB-029) | timestamps | UNIQUE(sede_id, servicio_id) |

### `planes`
| id | codigo UNIQUE | nombre | descripcion | precio DECIMAL(12,2) (precio del paquete) | afecto_igv | is_active | timestamps + deleted_at |

### `plan_items` (componentes del plan)
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| plan_id | FK planes | |
| item_tipo | VARCHAR(10) | 'PRODUCTO' \| 'SERVICIO' |
| producto_id | FK productos NULL | |
| servicio_id | FK servicios NULL | |
| cantidad | DECIMAL(12,3) | |
| | | CHECK: exactamente uno de producto_id/servicio_id según item_tipo |

## 10.5 Corporativo — Terceros

### `proveedores`
| id | tipo_documento VARCHAR(10) | numero_documento VARCHAR(20) | razon_social VARCHAR(200) | nombre_comercial NULL | telefono | correo | direccion NULL | distrito_id BIGINT UNSIGNED NULL (FK `distritos.id`, ver §10.2.1) | is_active | timestamps + deleted_at | UNIQUE(tipo_documento, numero_documento) |

### `financiadores` (RB-012)
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| tipo | VARCHAR(20) | 'CLIENTE','SIS','ESSALUD','ASEGURADORA','INSTITUCION','EMPRESA','CONVENIO','OTRO' |
| nombre | VARCHAR(200) | |
| tipo_documento | VARCHAR(10) NULL | |
| numero_documento | VARCHAR(20) NULL | |
| telefono / correo | | |
| dias_credito | INT NULL | plazo para CxC |
| is_active | TINYINT(1) | |
| timestamps + deleted_at | | |

> El financiador "cliente genérico" puede modelarse como un financiador de tipo `CLIENTE` vinculado dinámicamente al cliente de la venta, o cada financiamiento de tipo cliente referencia directamente `cliente_id`. **Decisión:** el financiamiento del cliente usa `cliente_id` directamente; los financiamientos institucionales usan `financiador_id`. Ver §10.9.

### `clientes`
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| tipo_documento | VARCHAR(10) | 'DNI','CE','PASAPORTE','RUC' |
| numero_documento | VARCHAR(20) | |
| nombres | VARCHAR(150) | |
| apellidos | VARCHAR(150) NULL | (RUC: razón social en nombres) |
| telefono | VARCHAR(30) NULL | |
| correo | VARCHAR(150) NULL | |
| direccion | VARCHAR(255) NULL | |
| distrito_id | BIGINT UNSIGNED NULL | FK `distritos.id`, ver §10.2.1 |
| is_active | TINYINT(1) | |
| timestamps + deleted_at | | UNIQUE(tipo_documento, numero_documento) |

### `metodos_pago`
| id | codigo UNIQUE ('EFECTIVO','TRANSFERENCIA','POS','YAPE','PLIN','OTROS') | nombre | es_efectivo TINYINT(1) | is_active | timestamps |

### `destinos_pago` (RB-009, RB-027)
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| tipo | VARCHAR(20) | 'CAJA','CUENTA_BANCARIA','POS','BILLETERA_DIGITAL','OTRO' |
| nombre | VARCHAR(150) | 'Cuenta BCP Principal', 'Caja Caraz' |
| sede_administradora_id | FK sedes NULL | sede que administra el destino |
| caja_id | FK cajas NULL | si tipo='CAJA' |
| numero_referencia | VARCHAR(80) NULL | nro cuenta enmascarado / id POS |
| is_active | TINYINT(1) | |
| timestamps | | |

## 10.6 Operativo por sede — Inventario

### `inventarios` (RB-002, ADR-008)
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| sede_id | FK sedes | |
| producto_id | FK productos | |
| stock_actual | DECIMAL(12,3) | default 0, CHECK >= 0 |
| stock_minimo | DECIMAL(12,3) | default 0 |
| stock_maximo | DECIMAL(12,3) NULL | |
| costo_promedio | DECIMAL(12,2) | default 0 |
| timestamps | | `UNIQUE(sede_id, producto_id)` |

### `movimientos_inventario` (kardex, RF-042/043)
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| sede_id | FK | |
| producto_id | FK | |
| tipo | VARCHAR(24) | COMPRA, TRANSFERENCIA_ENTRADA, TRANSFERENCIA_SALIDA, VENTA, DEVOLUCION, AJUSTE_ENTRADA, AJUSTE_SALIDA, MERMA, ANULACION_VENTA |
| cantidad | DECIMAL(12,3) | positiva; el signo lo da el tipo |
| costo_unitario | DECIMAL(12,2) NULL | |
| stock_anterior | DECIMAL(12,3) | |
| stock_posterior | DECIMAL(12,3) | |
| documento_tipo | VARCHAR(24) NULL | 'COMPRA','VENTA','TRANSFERENCIA','AJUSTE' |
| documento_id | BIGINT UNSIGNED NULL | id del documento origen |
| motivo | VARCHAR(255) NULL | obligatorio en ajustes/mermas |
| usuario_id | FK usuarios | |
| created_at | DATETIME | (inmutable; sin updated_at/soft delete) |

Índices: `(sede_id, producto_id, created_at)`, `(documento_tipo, documento_id)`, `tipo`.

## 10.7 Operativo — Compras (centralizadas)

### `compras`
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| sede_id | FK sedes | = sede principal (RB-001) |
| proveedor_id | FK proveedores | |
| numero_documento | VARCHAR(40) NULL | factura/guía |
| fecha | DATE | |
| subtotal / igv / total | DECIMAL(12,2) | |
| estado | VARCHAR(16) | 'BORRADOR','RECIBIDA','ANULADA' |
| usuario_id | FK usuarios | responsable |
| observaciones | VARCHAR(500) NULL | |
| timestamps + deleted_at | | |

### `detalle_compra`
| id | compra_id FK | producto_id FK | cantidad DECIMAL(12,3) | costo_unitario DECIMAL(12,2) | subtotal DECIMAL(12,2) | afecto_igv | timestamps |

## 10.8 Operativo — Transferencias

### `transferencias_inventario` (ADR-013)
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| codigo | VARCHAR(30) UNIQUE | correlativo |
| sede_origen_id | FK sedes | |
| sede_destino_id | FK sedes | CHECK origen ≠ destino |
| estado | VARCHAR(16) | SOLICITADA, APROBADA, ENVIADA, RECIBIDA, CANCELADA |
| motivo | VARCHAR(255) NULL | |
| usuario_solicita_id | FK usuarios | |
| usuario_aprueba_id | FK usuarios NULL | |
| usuario_envia_id | FK usuarios NULL | |
| usuario_recibe_id | FK usuarios NULL | |
| fecha_solicitud / fecha_envio / fecha_recepcion | DATETIME NULL | |
| timestamps + deleted_at | | |

### `detalle_transferencia_inventario`
| id | transferencia_inventario_id FK | producto_id FK | cantidad DECIMAL(12,3) | timestamps |

## 10.9 Operativo — Ventas

### `ventas`
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| codigo | VARCHAR(30) UNIQUE | correlativo por sede/serie |
| sede_venta_id | FK sedes | RB-006 |
| cliente_id | FK clientes | |
| usuario_id | FK usuarios | vendedor |
| cotizacion_id | FK cotizaciones NULL | origen |
| fecha | DATETIME | |
| subtotal | DECIMAL(12,2) | |
| descuento | DECIMAL(12,2) | default 0 |
| base_imponible | DECIMAL(12,2) | |
| igv | DECIMAL(12,2) | |
| total | DECIMAL(12,2) | |
| estado | VARCHAR(16) | 'CONFIRMADA','ANULADA' (opcional 'BORRADOR') |
| observaciones | VARCHAR(500) NULL | |
| anulada_motivo | VARCHAR(255) NULL | |
| anulada_por / anulada_at | FK/DATETIME NULL | |
| timestamps + deleted_at | | |

### `detalle_venta`
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| venta_id | FK | |
| item_tipo | VARCHAR(10) | 'PRODUCTO','SERVICIO','PLAN' |
| producto_id | FK NULL | |
| servicio_id | FK NULL | |
| plan_id | FK NULL | |
| descripcion | VARCHAR(200) | snapshot del nombre |
| cantidad | DECIMAL(12,3) | |
| precio_unitario | DECIMAL(12,2) | snapshot |
| descuento_linea | DECIMAL(12,2) | default 0 |
| afecto_igv | TINYINT(1) | |
| subtotal | DECIMAL(12,2) | |
| timestamps | | CHECK: uno de producto/servicio/plan según item_tipo |

### `servicios_contratados` (operación funeraria, ver [20](20_ventas.md))
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| venta_id | FK ventas | |
| sede_id | FK sedes | |
| tipo_servicio | VARCHAR(40) | 'VELATORIO','CREMACION','SEPULTURA','TRASLADO', etc. |
| fecha_servicio | DATETIME NULL | |
| lugar | VARCHAR(200) NULL | |
| estado_operativo | VARCHAR(20) | 'PROGRAMADO','EN_CURSO','FINALIZADO','CANCELADO' |
| responsable_usuario_id | FK usuarios NULL | |
| observaciones | VARCHAR(500) NULL | |
| timestamps + deleted_at | | |

> No se almacenan datos sensibles del fallecido más allá de lo operativo mínimo (ver [17](17_proteccion_datos.md)).

## 10.10 Operativo — Financiamiento (ADR-010, ADR-012)

### `financiamientos`
Representa **quién asume** una porción del total de la venta.

| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| venta_id | FK ventas | |
| origen_tipo | VARCHAR(12) | 'CLIENTE' \| 'FINANCIADOR' |
| cliente_id | FK clientes NULL | si origen_tipo='CLIENTE' |
| financiador_id | FK financiadores NULL | si origen_tipo='FINANCIADOR' |
| monto | DECIMAL(12,2) | porción asumida (RB-021: Σ = ventas.total) |
| monto_autorizado | DECIMAL(12,2) NULL | para coberturas |
| estado | VARCHAR(24) | PENDIENTE, DOCUMENTADA, ENVIADA, OBSERVADA, APROBADA, RECHAZADA, PARCIALMENTE_PAGADA, PAGADA, CANCELADA |
| numero_poliza | VARCHAR(60) NULL | |
| documento_cobertura_url | VARCHAR(500) NULL | S3 |
| fecha_solicitud / fecha_aprobacion / fecha_pago | DATETIME NULL | |
| observaciones | VARCHAR(500) NULL | |
| timestamps + deleted_at | | CHECK: exactamente uno de cliente_id/financiador_id según origen_tipo |

> **Saldo pendiente** (derivado, no columna): `monto − Σ(pagos.monto WHERE financiamiento_id = X AND estado='CONFIRMADO')`. Se expone calculado (RB-023). Opcionalmente materializable en vista/consulta agregada para reportes CxC.

## 10.11 Operativo — Pagos (ADR-010, ADR-011)

### `pagos`
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| financiamiento_id | FK financiamientos | a qué obligación se aplica (RB-022) |
| venta_id | FK ventas | redundante para consulta rápida (= financiamiento.venta_id) |
| monto | DECIMAL(12,2) | > 0 |
| metodo_pago_id | FK metodos_pago | |
| destino_pago_id | FK destinos_pago | RB-027 |
| sede_cobro_id | FK sedes | RB-007 |
| apertura_caja_id | FK aperturas_caja NULL | solo si efectivo (RB-008) |
| fecha | DATETIME | |
| estado | VARCHAR(16) | 'CONFIRMADO','ANULADO' |
| referencia | VARCHAR(100) NULL | nro operación/voucher |
| usuario_id | FK usuarios | |
| anulado_motivo / anulado_por / anulado_at | | |
| timestamps + deleted_at | | |

Reglas de integridad (validadas en service, ver [22](22_pagos_cajas.md)):
- Si `metodo_pago.es_efectivo=1` → `destino_pago.tipo='CAJA'` de `sede_cobro_id`, y `apertura_caja_id` obligatorio.
- Si `es_efectivo=0` → `destino_pago.tipo≠'CAJA'`, `apertura_caja_id` NULL.

## 10.12 Operativo — Cajas (ADR-011)

### `cajas`
| id | sede_id FK | nombre VARCHAR(120) | is_active | timestamps | UNIQUE(sede_id, nombre) |

### `aperturas_caja`
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| caja_id | FK cajas | |
| sede_id | FK sedes | (denormalizado para filtro) |
| usuario_apertura_id | FK usuarios | |
| usuario_cierre_id | FK usuarios NULL | |
| saldo_inicial | DECIMAL(12,2) | |
| saldo_esperado | DECIMAL(12,2) NULL | calculado al cierre |
| saldo_contado | DECIMAL(12,2) NULL | |
| diferencia | DECIMAL(12,2) NULL | contado − esperado |
| estado | VARCHAR(10) | 'ABIERTA','CERRADA' |
| fecha_apertura / fecha_cierre | DATETIME | |
| timestamps | | Índice único parcial: una ABIERTA por caja (validación service + `is_abierta_flag` UNIQUE) |

### `movimientos_caja`
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| apertura_caja_id | FK aperturas_caja | |
| caja_id | FK | |
| sede_id | FK | |
| tipo | VARCHAR(16) | 'INGRESO','EGRESO','VENTA_EFECTIVO','RETIRO' |
| monto | DECIMAL(12,2) | positivo |
| pago_id | FK pagos NULL | si proviene de un pago en efectivo |
| concepto | VARCHAR(255) | |
| usuario_id | FK usuarios | |
| created_at | DATETIME | inmutable |

## 10.13 Operativo — Cotizaciones

### `cotizaciones`
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| codigo | VARCHAR(30) UNIQUE | |
| origen | VARCHAR(12) | WEB, WHATSAPP, TELEFONO, PRESENCIAL, OTRO |
| solicitante_nombres | VARCHAR(150) | |
| solicitante_telefono | VARCHAR(30) | |
| solicitante_correo | VARCHAR(150) NULL | |
| cliente_id | FK clientes NULL | si ya es cliente |
| sede_preferida_id | FK sedes NULL | |
| sede_asignada_id | FK sedes NULL | |
| plan_id | FK planes NULL | |
| observaciones | VARCHAR(1000) NULL | |
| estado | VARCHAR(16) | SOLICITADA, EN_REVISION, ASIGNADA, CONTACTADA, EN_NEGOCIACION, ACEPTADA, RECHAZADA, VENCIDA, CANCELADA |
| fecha | DATETIME | |
| valido_hasta | DATE NULL | |
| consentimiento_datos | TINYINT(1) | (web, Ley 29733) |
| usuario_asignado_id | FK usuarios NULL | |
| timestamps + deleted_at | | |

### `detalle_cotizacion`
| id | cotizacion_id FK | item_tipo ('PRODUCTO','SERVICIO') | producto_id FK NULL | servicio_id FK NULL | cantidad | precio_referencial DECIMAL(12,2) NULL | timestamps |

## 10.14 Transversal — Auditoría

### `auditoria`
| Columna | Tipo | Notas |
|---|---|---|
| id | PK | |
| usuario_id | FK usuarios NULL | NULL si anónimo/sistema |
| accion | VARCHAR(40) | 'LOGIN','CREATE','UPDATE','DELETE','STATE_CHANGE','SALE','SALE_VOID','INVENTORY_MOVE','TRANSFER','PURCHASE','PAYMENT','CASH_OPEN','CASH_CLOSE','PERMISSION_CHANGE' |
| entidad | VARCHAR(60) | nombre de tabla/recurso |
| entidad_id | BIGINT UNSIGNED NULL | |
| sede_id | FK sedes NULL | contexto |
| ip | VARCHAR(45) NULL | |
| datos | JSON NULL | payload relevante (diff/valores) |
| created_at | DATETIME | inmutable |

Índices: `(entidad, entidad_id)`, `(usuario_id, created_at)`, `accion`, `sede_id`.

---

## 10.15 Resumen de tablas

Corporativas (18): `configuracion_empresa`, `sedes`, `usuarios`, `roles`, `permisos`, `rol_permiso`, `usuario_rol`, `usuario_sede`, `refresh_tokens`, `categorias_producto`, `productos`, `servicios`, `sede_servicio`, `planes`, `plan_items`, `proveedores`, `financiadores`, `clientes`, `metodos_pago`, `destinos_pago`.

Operativas por sede (17): `inventarios`, `movimientos_inventario`, `compras`, `detalle_compra`, `transferencias_inventario`, `detalle_transferencia_inventario`, `ventas`, `detalle_venta`, `servicios_contratados`, `financiamientos`, `pagos`, `cajas`, `aperturas_caja`, `movimientos_caja`, `cotizaciones`, `detalle_cotizacion`.

Transversal (1): `auditoria`.

Ver relaciones en [12](12_erd.md) y detalle de índices/constraints en [11](11_convencion_base_datos.md) y [44-45 del prompt].
