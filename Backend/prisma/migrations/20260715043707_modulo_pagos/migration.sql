-- CreateTable
CREATE TABLE `pagos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `pedido_id` BIGINT NOT NULL,
    `metodo_pago` ENUM('efectivo', 'yape', 'plin', 'transferencia', 'tarjeta') NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `monto_recibido` DECIMAL(10, 2) NULL,
    `vuelto` DECIMAL(10, 2) NULL,
    `observacion` VARCHAR(255) NULL,
    `creado_por_id` BIGINT NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pagos_pedido_id_idx`(`pedido_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_creado_por_id_fkey` FOREIGN KEY (`creado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

