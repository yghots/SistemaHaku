/*
  Warnings:

  - You are about to drop the column `url_imagen` on the `fotos_entrega` table. All the data in the column will be lost.
  - Added the required column `imagen` to the `fotos_entrega` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `fotos_entrega` DROP COLUMN `url_imagen`,
    ADD COLUMN `imagen` LONGBLOB NOT NULL,
    ADD COLUMN `mime_type` VARCHAR(50) NOT NULL DEFAULT 'image/webp';
