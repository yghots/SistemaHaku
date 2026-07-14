export type ClassValue = string | number | false | null | undefined | ClassValue[];

/**
 * Combina clases de Tailwind condicionalmente, aplanando arrays anidados y
 * descartando valores falsy. Usado por todos los componentes en vez de
 * concatenar strings a mano.
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
      continue;
    }
    out.push(String(value));
  }

  return out.join(' ');
}
