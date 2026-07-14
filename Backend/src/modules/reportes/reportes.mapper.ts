import { ReporteMotorizadoItemDto } from './dto/reporte-motorizado-item.dto';
import { ReportePedidoItemDto } from './dto/reporte-pedido-item.dto';
import {
  ReporteMotorizadoRow,
  ReportePedidoRow,
} from './interfaces/reportes-repository.interface';

export class ReportesMapper {
  static toPedidoItemDto(row: ReportePedidoRow): ReportePedidoItemDto {
    return new ReportePedidoItemDto({
      id: row.id.toString(),
      codigoPedido: row.codigoPedido,
      estado: row.estado,
      creadoEn: row.creadoEn,
      sucursalId: row.sucursalId.toString(),
      sucursalNombre: row.sucursalNombre,
      tiendaId: row.tiendaId.toString(),
      tiendaNombre: row.tiendaNombre,
      clienteId: row.clienteId.toString(),
      motorizadoActualId: row.motorizadoActualId?.toString() ?? null,
    });
  }

  static toPedidoItemDtoList(rows: ReportePedidoRow[]): ReportePedidoItemDto[] {
    return rows.map((row) => ReportesMapper.toPedidoItemDto(row));
  }

  static toMotorizadoItemDto(
    row: ReporteMotorizadoRow,
  ): ReporteMotorizadoItemDto {
    const productividad =
      row.pedidosAtendidos > 0
        ? Math.round((row.entregas / row.pedidosAtendidos) * 100 * 100) / 100
        : 0;

    return new ReporteMotorizadoItemDto({
      motorizadoId: row.motorizadoId.toString(),
      nombres: row.nombres,
      apellidos: row.apellidos,
      placa: row.placa,
      estado: row.estado,
      pedidosAtendidos: row.pedidosAtendidos,
      entregas: row.entregas,
      incidentes: row.incidentes,
      productividad,
    });
  }

  static toMotorizadoItemDtoList(
    rows: ReporteMotorizadoRow[],
  ): ReporteMotorizadoItemDto[] {
    return rows.map((row) => ReportesMapper.toMotorizadoItemDto(row));
  }
}
