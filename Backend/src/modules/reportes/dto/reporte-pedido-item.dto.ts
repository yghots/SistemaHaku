import { ApiProperty } from '@nestjs/swagger';
import { EstadoPedido, MetodoPago } from '@prisma/client';
import type { EstadoPagoPedido } from '../../../common/types/estado-pago-pedido.type';

export class ReportePedidoItemDto {
  @ApiProperty({ description: 'Identificador unico del pedido' })
  id: string;

  @ApiProperty({ description: 'Codigo del pedido' })
  codigoPedido: string;

  @ApiProperty({ description: 'Estado actual del pedido', enum: EstadoPedido })
  estado: EstadoPedido;

  @ApiProperty({ description: 'Fecha y hora de creacion del pedido' })
  creadoEn: Date;

  @ApiProperty({ description: 'Id de la sucursal de recojo' })
  sucursalId: string;

  @ApiProperty({ description: 'Nombre de la sucursal de recojo' })
  sucursalNombre: string;

  @ApiProperty({ description: 'Id de la tienda propietaria de la sucursal' })
  tiendaId: string;

  @ApiProperty({ description: 'Nombre de la tienda' })
  tiendaNombre: string;

  @ApiProperty({ description: 'Id del cliente destinatario' })
  clienteId: string;

  @ApiProperty({
    description: 'Id del motorizado asignado actualmente',
    nullable: true,
  })
  motorizadoActualId: string | null;

  @ApiProperty({
    description:
      'Total pagado hasta el momento, calculado a partir de los pagos registrados (Fase 21, modulo Pagos) — nunca almacenado',
  })
  totalPagado: string;

  @ApiProperty({
    description: 'Saldo pendiente de pago (Fase 21)',
  })
  saldoPendiente: string;

  @ApiProperty({
    description: 'Estado de pago del pedido (Fase 21)',
    enum: ['sin_pago', 'pago_parcial', 'pagado'],
  })
  estadoPago: EstadoPagoPedido;

  @ApiProperty({
    description:
      'Metodos de pago utilizados en el pedido, sin duplicados (Fase 21)',
    enum: MetodoPago,
    isArray: true,
  })
  metodosUtilizados: MetodoPago[];

  constructor(partial: ReportePedidoItemDto) {
    Object.assign(this, partial);
  }
}
