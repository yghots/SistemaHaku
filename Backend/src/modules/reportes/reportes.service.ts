import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ExportArchivo,
  ExportColumna,
} from '../../common/exports/export.types';
import { ExportService } from '../../common/exports/export.service';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { fetchAllPages } from '../../common/utils/fetch-all-pages.util';
import { ReporteEntregasExportQueryDto } from './dto/reporte-entregas-export-query.dto';
import { ReporteEntregasQueryDto } from './dto/reporte-entregas-query.dto';
import { ReporteMotorizadoItemDto } from './dto/reporte-motorizado-item.dto';
import { ReporteMotorizadosExportQueryDto } from './dto/reporte-motorizados-export-query.dto';
import { ReporteMotorizadosQueryDto } from './dto/reporte-motorizados-query.dto';
import { ReportePedidoItemDto } from './dto/reporte-pedido-item.dto';
import { ReportePedidosExportQueryDto } from './dto/reporte-pedidos-export-query.dto';
import { ReportePedidosQueryDto } from './dto/reporte-pedidos-query.dto';
import {
  ESTADOS_REPORTE_ENTREGAS,
  REPORTES_REPOSITORY,
} from './interfaces/reportes-repository.interface';
import type { IReportesRepository } from './interfaces/reportes-repository.interface';
import { ReportesMapper } from './reportes.mapper';

const COLUMNAS_REPORTE_PEDIDOS: ExportColumna[] = [
  { clave: 'codigoPedido', encabezado: 'Código' },
  { clave: 'tiendaNombre', encabezado: 'Tienda' },
  { clave: 'sucursalNombre', encabezado: 'Sucursal' },
  { clave: 'clienteId', encabezado: 'Cliente (id)' },
  { clave: 'motorizadoActualId', encabezado: 'Motorizado (id)' },
  { clave: 'estado', encabezado: 'Estado' },
  { clave: 'creadoEn', encabezado: 'Creado' },
  { clave: 'totalPagado', encabezado: 'Total pagado' },
  { clave: 'saldoPendiente', encabezado: 'Saldo pendiente' },
  { clave: 'metodosUtilizados', encabezado: 'Métodos utilizados' },
];

// Reporte de Entregas (Fase 21) muestra estado de pago en vez del monto
// pagado/saldo (mismos datos subyacentes, distinto recorte por reporte).
const COLUMNAS_REPORTE_ENTREGAS: ExportColumna[] = [
  { clave: 'codigoPedido', encabezado: 'Código' },
  { clave: 'tiendaNombre', encabezado: 'Tienda' },
  { clave: 'sucursalNombre', encabezado: 'Sucursal' },
  { clave: 'clienteId', encabezado: 'Cliente (id)' },
  { clave: 'motorizadoActualId', encabezado: 'Motorizado (id)' },
  { clave: 'estado', encabezado: 'Estado' },
  { clave: 'creadoEn', encabezado: 'Creado' },
  { clave: 'estadoPago', encabezado: 'Estado de pago' },
  { clave: 'metodosUtilizados', encabezado: 'Métodos utilizados' },
];

const ESTADO_PAGO_LABEL: Record<string, string> = {
  sin_pago: 'Sin pago',
  pago_parcial: 'Pago parcial',
  pagado: 'Pagado',
};

// Fase 28 (correccion C1 de la auditoria): tope maximo de filas exportables
// por solicitud. Aplicado en las 3 exportaciones via `fetchAllPages` — ver
// ese archivo para el detalle de donde y como se corta antes de generar
// el archivo.
const LIMITE_EXPORTACION_FILAS = 50_000;

const COLUMNAS_REPORTE_MOTORIZADOS: ExportColumna[] = [
  { clave: 'nombres', encabezado: 'Nombres' },
  { clave: 'apellidos', encabezado: 'Apellidos' },
  { clave: 'placa', encabezado: 'Placa' },
  { clave: 'pedidosAtendidos', encabezado: 'Pedidos atendidos' },
  { clave: 'entregas', encabezado: 'Entregas' },
  { clave: 'incidentes', encabezado: 'Incidentes' },
  { clave: 'productividad', encabezado: 'Productividad (%)' },
];

/** Convierte un `ReportePedidoItemDto` ya mapeado a la fila plana que consume la infraestructura de exportacion — la misma forma base para Reporte de Pedidos y Reporte de Entregas (comparten DTO); cada exportacion solo referencia el subconjunto de claves que le corresponde via `COLUMNAS_REPORTE_PEDIDOS`/`COLUMNAS_REPORTE_ENTREGAS`. */
function filaDesdePedido(item: ReportePedidoItemDto): Record<string, string> {
  return {
    codigoPedido: item.codigoPedido,
    tiendaNombre: item.tiendaNombre,
    sucursalNombre: item.sucursalNombre,
    clienteId: item.clienteId,
    motorizadoActualId: item.motorizadoActualId ?? '—',
    estado: item.estado,
    creadoEn: item.creadoEn.toLocaleString('es'),
    totalPagado: item.totalPagado,
    saldoPendiente: item.saldoPendiente,
    estadoPago: ESTADO_PAGO_LABEL[item.estadoPago] ?? item.estadoPago,
    metodosUtilizados: item.metodosUtilizados.join(', ') || '—',
  };
}

function filaDesdeMotorizado(
  item: ReporteMotorizadoItemDto,
): Record<string, string | number> {
  return {
    nombres: item.nombres,
    apellidos: item.apellidos,
    placa: item.placa,
    pedidosAtendidos: item.pedidosAtendidos,
    entregas: item.entregas,
    incidentes: item.incidentes,
    productividad: item.productividad,
  };
}

/** Arma el objeto `filtros` (solo texto, legible) a partir de los campos de un query DTO de exportacion, excluyendo `formato`/`generadoPor` (metadata de la exportacion, no un filtro del reporte). */
function filtrosAplicados(
  query: object,
  camposExcluidos: string[],
): Record<string, string> {
  const filtros: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(query)) {
    if (valor === undefined || valor === null) continue;
    if (['formato', 'generadoPor', 'page', 'limit', 'skip'].includes(clave))
      continue;
    if (camposExcluidos.includes(clave)) continue;
    filtros[clave] =
      valor instanceof Date ? valor.toISOString() : String(valor);
  }
  return filtros;
}

@Injectable()
export class ReportesService {
  constructor(
    @Inject(REPORTES_REPOSITORY)
    private readonly reportesRepository: IReportesRepository,
    private readonly exportService: ExportService,
  ) {}

  async reportePedidos(
    query: ReportePedidosQueryDto,
  ): Promise<PaginatedResponseDto<ReportePedidoItemDto>> {
    const { data, total } = await this.reportesRepository.reportePedidos({
      skip: query.skip,
      take: query.limit,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
      tiendaId: query.tiendaId ? BigInt(query.tiendaId) : undefined,
      estado: query.estado,
      motorizadoId: query.motorizadoId ? BigInt(query.motorizadoId) : undefined,
    });

    return new PaginatedResponseDto(
      ReportesMapper.toPedidoItemDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async reporteEntregas(
    query: ReporteEntregasQueryDto,
  ): Promise<PaginatedResponseDto<ReportePedidoItemDto>> {
    this.validarEstadoReporteEntregas(query.estado);

    const { data, total } = await this.reportesRepository.reporteEntregas({
      skip: query.skip,
      take: query.limit,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
      estado: query.estado,
    });

    return new PaginatedResponseDto(
      ReportesMapper.toPedidoItemDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async reporteMotorizados(
    query: ReporteMotorizadosQueryDto,
  ): Promise<PaginatedResponseDto<ReporteMotorizadoItemDto>> {
    const { data, total } = await this.reportesRepository.reporteMotorizados({
      skip: query.skip,
      take: query.limit,
      motorizadoId: query.motorizadoId ? BigInt(query.motorizadoId) : undefined,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
    });

    return new PaginatedResponseDto(
      ReportesMapper.toMotorizadoItemDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  /**
   * Las 3 exportaciones siguientes reutilizan exactamente el mismo
   * metodo de repositorio (la misma consulta Prisma) que su reporte
   * visual homónimo — nunca una consulta distinta. La unica diferencia
   * es que recorren todas las paginas (`fetchAllPages`) en vez de
   * devolver solo una, y delegan la generacion del archivo a
   * `ExportService` (Fase 18) — este servicio nunca construye un
   * archivo el mismo.
   */
  async exportarReportePedidos(
    query: ReportePedidosExportQueryDto,
  ): Promise<ExportArchivo> {
    const filas = await fetchAllPages(
      (pagina) =>
        this.reportesRepository.reportePedidos({
          skip: pagina.skip,
          take: pagina.take,
          fechaDesde: query.fechaDesde,
          fechaHasta: query.fechaHasta,
          tiendaId: query.tiendaId ? BigInt(query.tiendaId) : undefined,
          estado: query.estado,
          motorizadoId: query.motorizadoId
            ? BigInt(query.motorizadoId)
            : undefined,
        }),
      undefined,
      LIMITE_EXPORTACION_FILAS,
    );

    return this.exportService.exportar(query.formato, {
      titulo: 'Reporte de Pedidos',
      columnas: COLUMNAS_REPORTE_PEDIDOS,
      filas: ReportesMapper.toPedidoItemDtoList(filas).map(filaDesdePedido),
      filtros: filtrosAplicados(query, []),
      generadoPor: query.generadoPor,
      generadoEn: new Date(),
    });
  }

  async exportarReporteEntregas(
    query: ReporteEntregasExportQueryDto,
  ): Promise<ExportArchivo> {
    this.validarEstadoReporteEntregas(query.estado);

    const filas = await fetchAllPages(
      (pagina) =>
        this.reportesRepository.reporteEntregas({
          skip: pagina.skip,
          take: pagina.take,
          fechaDesde: query.fechaDesde,
          fechaHasta: query.fechaHasta,
          estado: query.estado,
        }),
      undefined,
      LIMITE_EXPORTACION_FILAS,
    );

    return this.exportService.exportar(query.formato, {
      titulo: 'Reporte de Entregas',
      columnas: COLUMNAS_REPORTE_ENTREGAS,
      filas: ReportesMapper.toPedidoItemDtoList(filas).map(filaDesdePedido),
      filtros: filtrosAplicados(query, []),
      generadoPor: query.generadoPor,
      generadoEn: new Date(),
    });
  }

  async exportarReporteMotorizados(
    query: ReporteMotorizadosExportQueryDto,
  ): Promise<ExportArchivo> {
    const filas = await fetchAllPages(
      (pagina) =>
        this.reportesRepository.reporteMotorizados({
          skip: pagina.skip,
          take: pagina.take,
          motorizadoId: query.motorizadoId
            ? BigInt(query.motorizadoId)
            : undefined,
          fechaDesde: query.fechaDesde,
          fechaHasta: query.fechaHasta,
        }),
      undefined,
      LIMITE_EXPORTACION_FILAS,
    );

    return this.exportService.exportar(query.formato, {
      titulo: 'Reporte de Productividad de Motorizados',
      columnas: COLUMNAS_REPORTE_MOTORIZADOS,
      filas:
        ReportesMapper.toMotorizadoItemDtoList(filas).map(filaDesdeMotorizado),
      filtros: filtrosAplicados(query, []),
      generadoPor: query.generadoPor,
      generadoEn: new Date(),
    });
  }

  private validarEstadoReporteEntregas(
    estado: ReporteEntregasQueryDto['estado'],
  ): void {
    if (estado && !ESTADOS_REPORTE_ENTREGAS.includes(estado)) {
      throw new BadRequestException(
        `El estado debe ser uno de: ${ESTADOS_REPORTE_ENTREGAS.join(', ')}`,
      );
    }
  }
}
