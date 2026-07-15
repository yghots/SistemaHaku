import { SIN_VALOR_LABEL } from './format-optional';

/**
 * Unica configuracion de moneda del proyecto (Bugfix de localizacion: el
 * sistema es exclusivamente para Peru). Cambiar de moneda en una fase
 * futura solo requiere editar esta constante — ningun componente que
 * llama a `formatMonto` necesita tocarse.
 */
const MONEDA_ACTUAL = { locale: 'es-PE', currency: 'PEN' } as const;

const formatter = new Intl.NumberFormat(MONEDA_ACTUAL.locale, {
  style: 'currency',
  currency: MONEDA_ACTUAL.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Unica utilidad de formateo de dinero del proyecto — usar siempre esta
 * funcion para mostrar un monto, nunca concatenar un simbolo de moneda a
 * mano en un componente. Usa `Intl.NumberFormat` nativo (sin librerias
 * externas): separadores de miles, dos decimales y el simbolo de la
 * moneda vigente (`MONEDA_ACTUAL`) los resuelve el propio `Intl`.
 * `null`/`undefined`/un valor no numerico (ej. un monto opcional que
 * nunca se completo) se muestran como `SIN_VALOR_LABEL` — el mismo texto
 * que cualquier otro campo opcional sin valor en la aplicacion.
 */
export function formatMonto(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return SIN_VALOR_LABEL;
  const numero = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numero)) return SIN_VALOR_LABEL;
  return formatter.format(numero);
}
