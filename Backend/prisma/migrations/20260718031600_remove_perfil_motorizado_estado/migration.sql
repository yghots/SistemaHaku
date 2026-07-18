-- Fase 33 (Parte 4 del rediseno de ciclo de vida de Usuarios y Motorizados):
-- `PerfilMotorizado.estado` (enum EstadoMotorizado) nunca participo en
-- ninguna regla de negocio de flujo-pedido (hallazgo A3 de la auditoria,
-- Fase 27/29) — se elimina por completo, junto con su indice.
ALTER TABLE `perfiles_motorizados` DROP INDEX `perfiles_motorizados_estado_idx`;
ALTER TABLE `perfiles_motorizados` DROP COLUMN `estado`;
