-- AlterTable
-- Fase 16: se agregan `nombres`/`apellidos` como obligatorios. El proyecto
-- solo tiene datos de prueba (sin datos de produccion) — se usa un DEFAULT
-- temporal unicamente para poder aplicar la restriccion NOT NULL sobre las
-- filas existentes (backfill), y se elimina en la misma migracion para que
-- el estado final de la columna coincida exactamente con schema.prisma
-- (sin @default): cualquier fila nueva debe proveer estos campos
-- explicitamente, igual que cualquier otro campo obligatorio del modelo.
ALTER TABLE `usuarios`
    ADD COLUMN `apellidos` VARCHAR(100) NOT NULL DEFAULT 'Pendiente',
    ADD COLUMN `nombres` VARCHAR(100) NOT NULL DEFAULT 'Pendiente';

ALTER TABLE `usuarios`
    ALTER COLUMN `apellidos` DROP DEFAULT,
    ALTER COLUMN `nombres` DROP DEFAULT;
