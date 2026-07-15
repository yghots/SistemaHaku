import { ApiProperty } from '@nestjs/swagger';

/**
 * Nunca persistido: se calcula en cada solicitud a partir de los pagos
 * registrados (`PagosService`/`pagos-calculo.util.ts`). Todos los montos
 * viajan como `string` (igual que el resto del proyecto serializa
 * `Decimal`), para no perder precision en JSON.
 */
export class ResumenPagoPedidoDto {
  @ApiProperty({ description: 'Id del pedido' })
  pedidoId: string;

  @ApiProperty({ description: 'Total del pedido (valorProducto + costoEnvio)' })
  totalPedido: string;

  @ApiProperty({
    description: 'Total pagado (suma de los montos de los pagos registrados)',
  })
  totalPagado: string;

  @ApiProperty({ description: 'Saldo pendiente (nunca negativo)' })
  saldoPendiente: string;

  @ApiProperty({
    description:
      'Estado de pago calculado: "pagado" si totalPagado >= totalPedido',
    enum: ['pagado', 'pendiente'],
  })
  estadoPago: 'pagado' | 'pendiente';

  constructor(partial: ResumenPagoPedidoDto) {
    Object.assign(this, partial);
  }
}
