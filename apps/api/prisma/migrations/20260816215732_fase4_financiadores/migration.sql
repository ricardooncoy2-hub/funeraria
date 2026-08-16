-- CreateTable
CREATE TABLE `financiadores` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `tipo_documento` VARCHAR(10) NULL,
    `numero_documento` VARCHAR(20) NULL,
    `telefono` VARCHAR(30) NULL,
    `correo` VARCHAR(150) NULL,
    `dias_credito` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- AddForeignKey
ALTER TABLE `financiamientos` ADD CONSTRAINT `financiamientos_financiador_id_fkey` FOREIGN KEY (`financiador_id`) REFERENCES `financiadores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
