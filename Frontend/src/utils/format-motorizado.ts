import { nombreCompleto } from './nombre-completo';

export interface ConDatosMotorizado {
  nombres: string;
  apellidos: string;
  placa: string;
}

/**
 * Unica funcion del proyecto que define como representar a un motorizado
 * (Fase 17). A partir de esta fase, ninguna pantalla debe identificar a un
 * motorizado unicamente por su placa — siempre "Nombre Completo · Placa".
 * Reutiliza `nombreCompleto` (Fase 16) en vez de concatenar `nombres`/
 * `apellidos` de nuevo. Usada tal cual (representacion de una sola linea)
 * en Selects, columnas de tabla y `DetailList`; para un componente que
 * necesite dos lineas, reutilizar los mismos datos (`nombreCompleto(motorizado)`
 * y `motorizado.placa`) en vez de duplicar esta logica.
 */
export function formatMotorizado(motorizado: ConDatosMotorizado): string {
  return `${nombreCompleto(motorizado)} · ${motorizado.placa}`;
}
