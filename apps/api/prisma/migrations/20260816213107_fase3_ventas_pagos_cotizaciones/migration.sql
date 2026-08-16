-- CreateTable
CREATE TABLE `cotizaciones` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `origen` VARCHAR(12) NOT NULL,
    `solicitante_nombres` VARCHAR(150) NOT NULL,
    `solicitante_telefono` VARCHAR(30) NOT NULL,
    `solicitante_correo` VARCHAR(150) NULL,
    `cliente_id` BIGINT UNSIGNED NULL,
    `sede_preferida_id` BIGINT UNSIGNED NULL,
    `sede_asignada_id` BIGINT UNSIGNED NULL,
    `plan_id` BIGINT UNSIGNED NULL,
    `observaciones` VARCHAR(1000) NULL,
    `estado` VARCHAR(16) NOT NULL DEFAULT 'SOLICITADA',
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `valido_hasta` DATE NULL,
    `consentimiento_datos` BOOLEAN NOT NULL DEFAULT false,
    `usuario_asignado_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `cotizaciones_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `detalle_cotizacion` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `cotizacion_id` BIGINT UNSIGNED NOT NULL,
    `item_tipo` VARCHAR(10) NOT NULL,
    `producto_id` BIGINT UNSIGNED NULL,
    `servicio_id` BIGINT UNSIGNED NULL,
    `cantidad` DECIMAL(12, 3) NOT NULL,
    `precio_referencial` DECIMAL(12, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `detalle_cotizacion_cotizacion_id_idx`(`cotizacion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `ventas` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `sede_venta_id` BIGINT UNSIGNED NOT NULL,
    `cliente_id` BIGINT UNSIGNED NOT NULL,
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `cotizacion_id` BIGINT UNSIGNED NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `descuento` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `base_imponible` DECIMAL(12, 2) NOT NULL,
    `igv` DECIMAL(12, 2) NOT NULL,
    `total` DECIMAL(12, 2) NOT NULL,
    `estado` VARCHAR(16) NOT NULL DEFAULT 'CONFIRMADA',
    `observaciones` VARCHAR(500) NULL,
    `anulada_motivo` VARCHAR(255) NULL,
    `anulada_por` BIGINT UNSIGNED NULL,
    `anulada_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `ventas_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `detalle_venta` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `venta_id` BIGINT UNSIGNED NOT NULL,
    `item_tipo` VARCHAR(10) NOT NULL,
    `producto_id` BIGINT UNSIGNED NULL,
    `servicio_id` BIGINT UNSIGNED NULL,
    `plan_id` BIGINT UNSIGNED NULL,
    `descripcion` VARCHAR(200) NOT NULL,
    `cantidad` DECIMAL(12, 3) NOT NULL,
    `precio_unitario` DECIMAL(12, 2) NOT NULL,
    `descuento_linea` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `afecto_igv` BOOLEAN NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `detalle_venta_venta_id_idx`(`venta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `servicios_contratados` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `venta_id` BIGINT UNSIGNED NOT NULL,
    `sede_id` BIGINT UNSIGNED NOT NULL,
    `tipo_servicio` VARCHAR(40) NOT NULL,
    `fecha_servicio` DATETIME(3) NULL,
    `lugar` VARCHAR(200) NULL,
    `estado_operativo` VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADO',
    `responsable_usuario_id` BIGINT UNSIGNED NULL,
    `observaciones` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `financiamientos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `venta_id` BIGINT UNSIGNED NOT NULL,
    `origen_tipo` VARCHAR(12) NOT NULL,
    `cliente_id` BIGINT UNSIGNED NULL,
    `financiador_id` BIGINT UNSIGNED NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `monto_autorizado` DECIMAL(12, 2) NULL,
    `estado` VARCHAR(24) NOT NULL DEFAULT 'PENDIENTE',
    `numero_poliza` VARCHAR(60) NULL,
    `documento_cobertura_url` VARCHAR(500) NULL,
    `fecha_solicitud` DATETIME(3) NULL,
    `fecha_aprobacion` DATETIME(3) NULL,
    `fecha_pago` DATETIME(3) NULL,
    `observaciones` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `destinos_pago` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `sede_administradora_id` BIGINT UNSIGNED NULL,
    `caja_id` BIGINT UNSIGNED NULL,
    `numero_referencia` VARCHAR(80) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `financiamiento_id` BIGINT UNSIGNED NOT NULL,
    `venta_id` BIGINT UNSIGNED NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `metodo_pago_id` BIGINT UNSIGNED NOT NULL,
    `destino_pago_id` BIGINT UNSIGNED NOT NULL,
    `sede_cobro_id` BIGINT UNSIGNED NOT NULL,
    `apertura_caja_id` BIGINT UNSIGNED NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` VARCHAR(16) NOT NULL DEFAULT 'CONFIRMADO',
    `referencia` VARCHAR(100) NULL,
    `usuario_id` BIGINT UNSIGNED NOT NULL,
    `anulado_motivo` VARCHAR(255) NULL,
    `anulado_por` BIGINT UNSIGNED NULL,
    `anulado_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- AddForeignKey
ALTER TABLE `cotizaciones` ADD CONSTRAINT `cotizaciones_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones` ADD CONSTRAINT `cotizaciones_sede_preferida_id_fkey` FOREIGN KEY (`sede_preferida_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones` ADD CONSTRAINT `cotizaciones_sede_asignada_id_fkey` FOREIGN KEY (`sede_asignada_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones` ADD CONSTRAINT `cotizaciones_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `planes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cotizaciones` ADD CONSTRAINT `cotizaciones_usuario_asignado_id_fkey` FOREIGN KEY (`usuario_asignado_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_cotizacion` ADD CONSTRAINT `detalle_cotizacion_cotizacion_id_fkey` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_cotizacion` ADD CONSTRAINT `detalle_cotizacion_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_cotizacion` ADD CONSTRAINT `detalle_cotizacion_servicio_id_fkey` FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_sede_venta_id_fkey` FOREIGN KEY (`sede_venta_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_anulada_por_fkey` FOREIGN KEY (`anulada_por`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ventas` ADD CONSTRAINT `ventas_cotizacion_id_fkey` FOREIGN KEY (`cotizacion_id`) REFERENCES `cotizaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_venta` ADD CONSTRAINT `detalle_venta_venta_id_fkey` FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_venta` ADD CONSTRAINT `detalle_venta_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_venta` ADD CONSTRAINT `detalle_venta_servicio_id_fkey` FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_venta` ADD CONSTRAINT `detalle_venta_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `planes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicios_contratados` ADD CONSTRAINT `servicios_contratados_venta_id_fkey` FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicios_contratados` ADD CONSTRAINT `servicios_contratados_sede_id_fkey` FOREIGN KEY (`sede_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicios_contratados` ADD CONSTRAINT `servicios_contratados_responsable_usuario_id_fkey` FOREIGN KEY (`responsable_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financiamientos` ADD CONSTRAINT `financiamientos_venta_id_fkey` FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `financiamientos` ADD CONSTRAINT `financiamientos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `destinos_pago` ADD CONSTRAINT `destinos_pago_sede_administradora_id_fkey` FOREIGN KEY (`sede_administradora_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_financiamiento_id_fkey` FOREIGN KEY (`financiamiento_id`) REFERENCES `financiamientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_venta_id_fkey` FOREIGN KEY (`venta_id`) REFERENCES `ventas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_metodo_pago_id_fkey` FOREIGN KEY (`metodo_pago_id`) REFERENCES `metodos_pago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_destino_pago_id_fkey` FOREIGN KEY (`destino_pago_id`) REFERENCES `destinos_pago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_sede_cobro_id_fkey` FOREIGN KEY (`sede_cobro_id`) REFERENCES `sedes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_anulado_por_fkey` FOREIGN KEY (`anulado_por`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
