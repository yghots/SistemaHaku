import type { FormatoImportacion } from '../../common/imports/import.types';

export type EntidadImportacion = 'cliente' | 'tienda' | 'motorizado';

export const ENTIDADES_IMPORTACION: EntidadImportacion[] = [
  'cliente',
  'tienda',
  'motorizado',
];

export const MIME_POR_FORMATO: Record<FormatoImportacion, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  json: 'application/json; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
};

/** Nombre base (plural) del archivo de plantilla oficial de cada entidad — ver src/modules/importaciones/plantillas/. */
export const NOMBRE_PLANTILLA_POR_ENTIDAD: Record<EntidadImportacion, string> =
  {
    cliente: 'clientes',
    tienda: 'tiendas',
    motorizado: 'motorizados',
  };

export function esEntidadImportacion(
  valor: string,
): valor is EntidadImportacion {
  return (ENTIDADES_IMPORTACION as string[]).includes(valor);
}
