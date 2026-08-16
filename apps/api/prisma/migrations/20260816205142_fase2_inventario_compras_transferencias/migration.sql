-- CreateTable
CREATE TABLE `proveedores` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tipo_documento` VARCHAR(10) NOT NULL,
    `numero_documento` VARCHAR(20) NOT NULL,
    `razon_social` VARCHAR(200) NOT NULL,
    `nombre_comercial` VARCHAR(200) NULL,
    `telefono` VARCHAR(30) NULL,
    `correo` VARCHAR(150) NULL,
    `direccion` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `proveedores_tipo_documento_numero_documento_key`(`tipo_documento`, `numero_documento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `inventarios` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sede_id` BIGINT UNSIGNED NOT NULL,
    `producto_id` BIGINT UNSIGNED NOT NULL,
    `stock_actual` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    `stock_minimo` DECIMAL(12, 3) NOT NULL DEFAULT 0,
    `stock_maximo` DECIMAL(12, 3) NULL,
    `costo_promedio` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `inventarios_sede_id_producto_id_key`(`sede_id`, `producto_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `inventarios_stock_actual_check` CHECK (`stock_actual` >= 0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `movimientos_inventario` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sede_id` BIGINT UNSIGNED NOT NULL,
    `producto_id` BIGINT UNSIGNED NOT NULL,
    `tipo` VARCHAR(24) NOT NULL,
    `cantidad` DECIMAL(12, 3) NOT NULL,
    `costo_unitario` DECIMAL(12, 2) NULL,
    `stock_anterior` DECIMAL(12, 3) NOT NULL,
    `stock_posterior` DECIMAL(12, 3) NOT NULL,
    `documento_tipo` VARCHAR(24) NULL,
    `documento_id` BIGINT UNSIGNED NULL,
    `motivo` VARCHAR(255) NULL,
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `movimientos_inventario_sede_id_producto_id_created_at_idx`(`sede_id`, `producto_id`, `created_at`),
    INDEX `movimientos_inventario_documento_tipo_documento_id_idx`(`documento_tipo`, `documento_id`),
    INDEX `movimientos_inventario_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `compras` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sede_id` BIGINT UNSIGNED NOT NULL,
    `proveedor_id` BIGINT UNSIGNED NOT NULL,
    `numero_documento` VARCHAR(40) NULL,
    `fecha` DATE NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `igv` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `estado` VARCHAR(16) NOT NULL DEFAULT 'BORRADOR',
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `observaciones` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `detalle_compra` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `compra_id` BIGINT UNSIGNED NOT NULL,
    `producto_id` BIGINT UNSIGNED NOT NULL,
    `cantidad` DECIMAL(12, 3) NOT NULL,
    `costo_unitario` DECIMAL(12, 2) NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `afecto_igv` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `detalle_compra_compra_id_idx`(`compra_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `transferencias_inventario` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `sede_origen_id` BIGINT UNSIGNED NOT NULL,
    `sede_destino_id` BIGINT UNSIGNED NOT NULL,
    `estado` VARCHAR(16) NOT NULL DEFAULT 'SOLICITADA',
    `motivo` VARCHAR(255) NULL,
    `usuario_solicita_id` BIGINT UNSIGNED NOT NULL,
    `usuario_aprueba_id` BIGINT UNSIGNED NULL,
    `usuario_envia_id` BIGINT UNSIGNED NULL,
    `usuario_recibe_id` BIGINT UNSIGNED NULL,
    `fecha_solicitud` DATETIME(3) NULL,
    `fecha_envio` DATETIME(3) NULL,
    `fecha_recepcion` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `transferencias_inventario_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
    -- sede_origen_id <> sede_destino_id se valida en InventoryTransfersService:
    -- el schema-engine de Prisma no logra crear CHECKs de dos columnas contra
    -- MariaDB 11.8 (mismo problema que plan_items_item_tipo_check en Fase 1;
    -- la sentencia SÍ es válida ejecutada directo por mysql client).
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `detalle_transferencia_inventario` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `transferencia_inventario_id` BIGINT UNSIGNED NOT NULL,
    `producto_id` BIGINT UNSIGNED NOT NULL,
    `cantidad` DECIMAL(12, 3) NOT NULL,
    `costo_unitario` DECIMAL(12, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `detalle_transferencia_inventario_transferencia_inventario_id_idx`(`transferencia_inventario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- AddForeignKey
ALTER TABLE `inventarios` ADD CONSTRAINT `inventarios_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventarios` ADD CONSTRAINT `inventarios_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_proveedor_id_fkey` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_compra` ADD CONSTRAINT `detalle_compra_compra_id_fkey` FOREIGN KEY (`compra_id`) REFERENCES `compras`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_compra` ADD CONSTRAINT `detalle_compra_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transferencias_inventario` ADD CONSTRAINT `transferencias_inventario_sede_origen_id_fkey` FOREIGN KEY (`sede_origen_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transferencias_inventario` ADD CONSTRAINT `transferencias_inventario_sede_destino_id_fkey` FOREIGN KEY (`sede_destino_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transferencias_inventario` ADD CONSTRAINT `transferencias_inventario_usuario_solicita_id_fkey` FOREIGN KEY (`usuario_solicita_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transferencias_inventario` ADD CONSTRAINT `transferencias_inventario_usuario_aprueba_id_fkey` FOREIGN KEY (`usuario_aprueba_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transferencias_inventario` ADD CONSTRAINT `transferencias_inventario_usuario_envia_id_fkey` FOREIGN KEY (`usuario_envia_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transferencias_inventario` ADD CONSTRAINT `transferencias_inventario_usuario_recibe_id_fkey` FOREIGN KEY (`usuario_recibe_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_transferencia_inventario` ADD CONSTRAINT `detalle_transferencia_inventario_transferencia_inventario_i_fkey` FOREIGN KEY (`transferencia_inventario_id`) REFERENCES `transferencias_inventario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_transferencia_inventario` ADD CONSTRAINT `detalle_transferencia_inventario_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
