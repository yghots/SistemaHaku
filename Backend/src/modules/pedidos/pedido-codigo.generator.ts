const PREFIJO = 'PED';
const LONGITUD_CONSECUTIVO = 6;

/**
 * Unico punto de generacion del codigo de negocio de un Pedido (Fase 24).
 * Formato: `PED-AAAA-NNNNNN`. Ningun otro modulo debe construir este codigo
 * manualmente — cualquier cambio de formato futuro se hace unicamente aqui.
 *
 * `AAAA` es el anio real de creacion (`Pedido.creadoEn`, nunca `new Date()`):
 * el codigo debe reflejar cuando el pedido realmente se creo, no la fecha en
 * que se ejecuta el codigo. `NNNNNN` es el `id` autoincremental como
 * consecutivo global (nunca reinicia por anio): el `id` ya es unico y
 * estrictamente creciente, asi que no hace falta ninguna tabla ni contador
 * auxiliar por anio para lograr un consecutivo que nunca se repite ni retrocede.
 */
export class PedidoCodigoGenerator {
  static generar(id: bigint, creadoEn: Date): string {
    const anio = creadoEn.getFullYear();
    const consecutivo = id.toString().padStart(LONGITUD_CONSECUTIVO, '0');
    return `${PREFIJO}-${anio}-${consecutivo}`;
  }
}
