-- CreateTable
CREATE TABLE `importacion_historial` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `entidad` ENUM('cliente', 'tienda', 'motorizado') NOT NULL,
    `archivo_nombre` VARCHAR(255) NOT NULL,
    `formato` ENUM('xlsx', 'json', 'xml') NOT NULL,
    `usuario_id` BIGINT NOT NULL,
    `total_encontrados` INTEGER NOT NULL,
    `importados` INTEGER NOT NULL,
    `duplicados` INTEGER NOT NULL,
    `errores` INTEGER NOT NULL,
    `tiempo_procesamiento_ms` INTEGER NOT NULL,
    `estado` ENUM('completado', 'parcial') NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `importacion_historial_entidad_creado_en_idx`(`entidad`, `creado_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `importacion_detalle` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `historial_id` BIGINT NOT NULL,
    `fila` INTEGER NOT NULL,
    `estado` ENUM('duplicado', 'invalido') NOT NULL,
    `motivo` VARCHAR(255) NOT NULL,
    `campo` VARCHAR(100) NULL,
    `valor` VARCHAR(255) NULL,

    INDEX `importacion_detalle_historial_id_idx`(`historial_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `clientes_documento_identidad_key` ON `clientes`(`documento_identidad`);

-- CreateIndex
CREATE UNIQUE INDEX `perfiles_motorizados_placa_key` ON `perfiles_motorizados`(`placa`);

-- AddForeignKey
ALTER TABLE `importacion_historial` ADD CONSTRAINT `importacion_historial_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `importacion_detalle` ADD CONSTRAINT `importacion_detalle_historial_id_fkey` FOREIGN KEY (`historial_id`) REFERENCES `importacion_historial`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

