-- CreateTable
CREATE TABLE `solicitudes_pedido` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sucursal_id` BIGINT NOT NULL,
    `nombre_completo` VARCHAR(150) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `direccion_entrega` VARCHAR(255) NOT NULL,
    `descripcion_producto` VARCHAR(255) NULL,
    `valor_producto` DECIMAL(10, 2) NULL,
    `costo_envio` DECIMAL(10, 2) NULL,
    `observaciones` VARCHAR(500) NULL,
    `estado` ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    `motivo_rechazo` VARCHAR(255) NULL,
    `cliente_id` BIGINT NULL,
    `pedido_id` BIGINT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revisado_en` DATETIME(3) NULL,

    UNIQUE INDEX `solicitudes_pedido_pedido_id_key`(`pedido_id`),
    INDEX `solicitudes_pedido_estado_idx`(`estado`),
    INDEX `solicitudes_pedido_creado_en_idx`(`creado_en`),
    INDEX `solicitudes_pedido_sucursal_id_idx`(`sucursal_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `solicitudes_pedido` ADD CONSTRAINT `solicitudes_pedido_sucursal_id_fkey` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_pedido` ADD CONSTRAINT `solicitudes_pedido_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_pedido` ADD CONSTRAINT `solicitudes_pedido_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
