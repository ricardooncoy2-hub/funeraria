-- CreateTable
CREATE TABLE `cajas` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sede_id` BIGINT UNSIGNED NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cajas_sede_id_nombre_key`(`sede_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `aperturas_caja` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `caja_id` BIGINT UNSIGNED NOT NULL,
    `sede_id` BIGINT UNSIGNED NOT NULL,
    `usuario_apertura_id` BIGINT UNSIGNED NOT NULL,
    `usuario_cierre_id` BIGINT UNSIGNED NULL,
    `saldo_inicial` DECIMAL(12, 2) NOT NULL,
    `saldo_esperado` DECIMAL(12, 2) NULL,
    `saldo_contado` DECIMAL(12, 2) NULL,
    `diferencia` DECIMAL(12, 2) NULL,
    `estado` VARCHAR(10) NOT NULL DEFAULT 'ABIERTA',
    `is_abierta_flag` TINYINT GENERATED ALWAYS AS (CASE WHEN `estado` = 'ABIERTA' THEN 1 ELSE NULL END) STORED,
    `fecha_apertura` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_cierre` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `aperturas_caja_caja_id_is_abierta_flag_key`(`caja_id`, `is_abierta_flag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `movimientos_caja` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `apertura_caja_id` BIGINT UNSIGNED NOT NULL,
    `caja_id` BIGINT UNSIGNED NOT NULL,
    `sede_id` BIGINT UNSIGNED NOT NULL,
    `tipo` VARCHAR(16) NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `pago_id` BIGINT UNSIGNED NULL,
    `concepto` VARCHAR(255) NOT NULL,
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `movimientos_caja_apertura_caja_id_idx`(`apertura_caja_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- AddForeignKey
ALTER TABLE `destinos_pago` ADD CONSTRAINT `destinos_pago_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `cajas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_apertura_caja_id_fkey` FOREIGN KEY (`apertura_caja_id`) REFERENCES `aperturas_caja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cajas` ADD CONSTRAINT `cajas_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aperturas_caja` ADD CONSTRAINT `aperturas_caja_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `cajas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aperturas_caja` ADD CONSTRAINT `aperturas_caja_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aperturas_caja` ADD CONSTRAINT `aperturas_caja_usuario_apertura_id_fkey` FOREIGN KEY (`usuario_apertura_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aperturas_caja` ADD CONSTRAINT `aperturas_caja_usuario_cierre_id_fkey` FOREIGN KEY (`usuario_cierre_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_caja` ADD CONSTRAINT `movimientos_caja_apertura_caja_id_fkey` FOREIGN KEY (`apertura_caja_id`) REFERENCES `aperturas_caja`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_caja` ADD CONSTRAINT `movimientos_caja_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `cajas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_caja` ADD CONSTRAINT `movimientos_caja_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_caja` ADD CONSTRAINT `movimientos_caja_pago_id_fkey` FOREIGN KEY (`pago_id`) REFERENCES `pagos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_caja` ADD CONSTRAINT `movimientos_caja_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
