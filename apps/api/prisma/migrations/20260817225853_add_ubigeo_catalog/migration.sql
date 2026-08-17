-- AlterTable
ALTER TABLE `clientes` ADD COLUMN `distrito_id` BIGINT UNSIGNED NULL;

-- AlterTable
ALTER TABLE `proveedores` ADD COLUMN `distrito_id` BIGINT UNSIGNED NULL;

-- AlterTable
ALTER TABLE `sedes` DROP COLUMN `departamento`,
    DROP COLUMN `distrito`,
    DROP COLUMN `provincia`,
    ADD COLUMN `distrito_id` BIGINT UNSIGNED NULL;

-- CreateTable
CREATE TABLE `departamentos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(2) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `departamentos_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `provincias` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(4) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `departamento_id` BIGINT UNSIGNED NOT NULL,

    INDEX `provincias_departamento_id_idx`(`departamento_id`),
    UNIQUE INDEX `provincias_departamento_id_codigo_key`(`departamento_id`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateTable
CREATE TABLE `distritos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(6) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `provincia_id` BIGINT UNSIGNED NOT NULL,

    UNIQUE INDEX `distritos_codigo_key`(`codigo`),
    INDEX `distritos_provincia_id_idx`(`provincia_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;

-- CreateIndex
CREATE INDEX `clientes_distrito_id_idx` ON `clientes`(`distrito_id`);

-- CreateIndex
CREATE INDEX `proveedores_distrito_id_idx` ON `proveedores`(`distrito_id`);

-- CreateIndex
CREATE INDEX `sedes_distrito_id_idx` ON `sedes`(`distrito_id`);

-- AddForeignKey
ALTER TABLE `sedes` ADD CONSTRAINT `sedes_distrito_id_fkey` FOREIGN KEY (`distrito_id`) REFERENCES `distritos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_distrito_id_fkey` FOREIGN KEY (`distrito_id`) REFERENCES `distritos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proveedores` ADD CONSTRAINT `proveedores_distrito_id_fkey` FOREIGN KEY (`distrito_id`) REFERENCES `distritos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provincias` ADD CONSTRAINT `provincias_departamento_id_fkey` FOREIGN KEY (`departamento_id`) REFERENCES `departamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `distritos` ADD CONSTRAINT `distritos_provincia_id_fkey` FOREIGN KEY (`provincia_id`) REFERENCES `provincias`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

