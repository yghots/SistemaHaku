import { Prisma } from '@prisma/client';

// Codigos de error de Prisma usados de forma consistente en todo el
// proyecto para traducir violaciones de la base de datos a excepciones
// HTTP (ver cada *.service.ts que atrapa errores de escritura).
export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  );
}
