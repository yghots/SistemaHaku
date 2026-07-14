export interface ConNombreCompleto {
  nombres: string;
  apellidos: string;
}

/**
 * Unica funcion del proyecto que concatena `nombres` + `apellidos` de un
 * `Usuario` (Fase 16). Cualquier pantalla que necesite el nombre completo
 * de una persona debe reutilizar esta funcion — no concatenar los campos
 * a mano en ningun otro lugar.
 */
export function nombreCompleto({ nombres, apellidos }: ConNombreCompleto): string {
  return `${nombres} ${apellidos}`.trim();
}
