import { Pago } from '@prisma/client';
import { PagoResponseDto } from './dto/pago-response.dto';

export class PagosMapper {
  static toResponseDto(pago: Pago): PagoResponseDto {
    return new PagoResponseDto({
      id: pago.id.toString(),
      pedidoId: pago.pedidoId.toString(),
      metodoPago: pago.metodoPago,
      monto: pago.monto.toString(),
      montoRecibido: pago.montoRecibido?.toString() ?? null,
      vuelto: pago.vuelto?.toString() ?? null,
      observacion: pago.observacion,
      creadoPorId: pago.creadoPorId.toString(),
      creadoEn: pago.creadoEn,
    });
  }

  static toResponseDtoList(pagos: Pago[]): PagoResponseDto[] {
    return pagos.map((pago) => PagosMapper.toResponseDto(pago));
  }
}
