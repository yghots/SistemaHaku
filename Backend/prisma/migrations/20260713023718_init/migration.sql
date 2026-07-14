-- CreateTable
CREATE TABLE `usuarios` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usuario` VARCHAR(50) NOT NULL,
    `correo` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `rol` ENUM('administrador', 'motorizado') NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `usuarios_usuario_key`(`usuario`),
    UNIQUE INDEX `usuarios_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tiendas` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(150) NOT NULL,
    `ruc` VARCHAR(20) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sucursales` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `tienda_id` BIGINT NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `direccion` VARCHAR(255) NOT NULL,
    `referencia` VARCHAR(255) NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `es_principal` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nombre_completo` VARCHAR(150) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `direccion` VARCHAR(255) NOT NULL,
    `documento_identidad` VARCHAR(20) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perfiles_motorizados` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usuario_id` BIGINT NOT NULL,
    `placa` VARCHAR(15) NOT NULL,
    `estado` ENUM('disponible', 'ocupado', 'inactivo') NOT NULL DEFAULT 'disponible',

    UNIQUE INDEX `perfiles_motorizados_usuario_id_key`(`usuario_id`),
    INDEX `perfiles_motorizados_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pedidos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `codigo_pedido` VARCHAR(30) NOT NULL,
    `sucursal_id` BIGINT NOT NULL,
    `cliente_id` BIGINT NOT NULL,
    `motorizado_actual_id` BIGINT NULL,
    `creado_por_id` BIGINT NOT NULL,
    `direccion_entrega` VARCHAR(255) NOT NULL,
    `telefono_contacto` VARCHAR(20) NULL,
    `descripcion_producto` VARCHAR(255) NULL,
    `valor_producto` DECIMAL(10, 2) NULL,
    `costo_envio` DECIMAL(10, 2) NULL,
    `estado` ENUM('pendiente', 'asignado', 'recogido', 'en_ruta', 'entregado', 'cancelado', 'reprogramado', 'devuelto', 'rechazado', 'cliente_ausente') NOT NULL DEFAULT 'pendiente',
    `observaciones` VARCHAR(500) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pedidos_codigo_pedido_key`(`codigo_pedido`),
    INDEX `pedidos_estado_idx`(`estado`),
    INDEX `pedidos_creado_en_idx`(`creado_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_pedido` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `pedido_id` BIGINT NOT NULL,
    `tipo_evento` ENUM('cambio_estado', 'reasignacion') NOT NULL,
    `estado` ENUM('pendiente', 'asignado', 'recogido', 'en_ruta', 'entregado', 'cancelado', 'reprogramado', 'devuelto', 'rechazado', 'cliente_ausente') NULL,
    `motorizado_id` BIGINT NULL,
    `usuario_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historial_pedido_pedido_id_created_at_idx`(`pedido_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fotos_entrega` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `pedido_id` BIGINT NOT NULL,
    `motorizado_id` BIGINT NOT NULL,
    `tipo` ENUM('recojo', 'entrega') NOT NULL,
    `url_imagen` VARCHAR(500) NOT NULL,
    `es_principal` BOOLEAN NOT NULL DEFAULT false,

    INDEX `fotos_entrega_pedido_id_tipo_idx`(`pedido_id`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incidentes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `pedido_id` BIGINT NULL,
    `motorizado_id` BIGINT NOT NULL,
    `tipo` ENUM('accidente', 'averia', 'dano_producto', 'otro') NOT NULL,
    `resuelto` BOOLEAN NOT NULL DEFAULT false,

    INDEX `incidentes_motorizado_id_resuelto_idx`(`motorizado_id`, `resuelto`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sucursales` ADD CONSTRAINT `sucursales_tienda_id_fkey` FOREIGN KEY (`tienda_id`) REFERENCES `tiendas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perfiles_motorizados` ADD CONSTRAINT `perfiles_motorizados_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_sucursal_id_fkey` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_motorizado_actual_id_fkey` FOREIGN KEY (`motorizado_actual_id`) REFERENCES `perfiles_motorizados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_creado_por_id_fkey` FOREIGN KEY (`creado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_pedido` ADD CONSTRAINT `historial_pedido_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_pedido` ADD CONSTRAINT `historial_pedido_motorizado_id_fkey` FOREIGN KEY (`motorizado_id`) REFERENCES `perfiles_motorizados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_pedido` ADD CONSTRAINT `historial_pedido_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fotos_entrega` ADD CONSTRAINT `fotos_entrega_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fotos_entrega` ADD CONSTRAINT `fotos_entrega_motorizado_id_fkey` FOREIGN KEY (`motorizado_id`) REFERENCES `perfiles_motorizados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidentes` ADD CONSTRAINT `incidentes_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incidentes` ADD CONSTRAINT `incidentes_motorizado_id_fkey` FOREIGN KEY (`motorizado_id`) REFERENCES `perfiles_motorizados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
