import { NotFoundException } from '@nestjs/common';

// Helper compartido para el patron repetido "buscar por id, lanzar 404 si
// no existe" presente en todos los servicios del proyecto.
export function assertFound<T>(
  entity: T | null | undefined,
  message: string,
): T {
  if (!entity) {
    throw new NotFoundException(message);
  }
  return entity;
}
