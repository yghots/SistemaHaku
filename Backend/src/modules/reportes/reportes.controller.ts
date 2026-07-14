import { Controller, Get, Query, Res, StreamableFile } from '@nestjs/common';
import {
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ReporteEntregasExportQueryDto } from './dto/reporte-entregas-export-query.dto';
import { ReporteEntregasQueryDto } from './dto/reporte-entregas-query.dto';
import { ReporteMotorizadoItemDto } from './dto/reporte-motorizado-item.dto';
import { ReporteMotorizadosExportQueryDto } from './dto/reporte-motorizados-export-query.dto';
import { ReporteMotorizadosQueryDto } from './dto/reporte-motorizados-query.dto';
import { ReportePedidoItemDto } from './dto/reporte-pedido-item.dto';
import { ReportePedidosExportQueryDto } from './dto/reporte-pedidos-export-query.dto';
import { ReportePedidosQueryDto } from './dto/reporte-pedidos-query.dto';
import { ReportesService } from './reportes.service';

// Modulo de solo consulta (CU18/CU19/CU20): unicamente endpoints GET, sin
// crear, actualizar ni eliminar.
@ApiTags('Reportes')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('pedidos')
  @ApiOperation({
    summary:
      'Reporte de pedidos (CU18): filtros combinables por rango de fechas, tienda, estado y motorizado',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de pedidos para el reporte',
  })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  reportePedidos(
    @Query() query: ReportePedidosQueryDto,
  ): Promise<PaginatedResponseDto<ReportePedidoItemDto>> {
    return this.reportesService.reportePedidos(query);
  }

  @Get('entregas')
  @ApiOperation({
    summary:
      'Reporte de entregas (CU19): pedidos entregados, cancelados, devueltos o reprogramados, con filtro de fecha',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de pedidos para el reporte de entregas',
  })
  @ApiResponse({
    status: 400,
    description:
      'Parametros de consulta invalidos, o el estado solicitado no corresponde a un estado final de entrega',
  })
  reporteEntregas(
    @Query() query: ReporteEntregasQueryDto,
  ): Promise<PaginatedResponseDto<ReportePedidoItemDto>> {
    return this.reportesService.reporteEntregas(query);
  }

  @Get('motorizados')
  @ApiOperation({
    summary:
      'Reporte de motorizados (CU20): pedidos atendidos, entregas, incidentes y productividad por motorizado',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de metricas por motorizado',
  })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  reporteMotorizados(
    @Query() query: ReporteMotorizadosQueryDto,
  ): Promise<PaginatedResponseDto<ReporteMotorizadoItemDto>> {
    return this.reportesService.reporteMotorizados(query);
  }

  // Fase 18 — Infraestructura de Exportacion. Cada endpoint reutiliza
  // exactamente los mismos filtros y la misma consulta que su reporte
  // visual homonimo (ver ReportesService) — la unica responsabilidad de
  // este controller es fijar los headers HTTP de descarga.

  @Get('pedidos/export')
  @ApiOperation({
    summary:
      'Exporta el Reporte de Pedidos (xlsx, pdf, csv, json o xml) con los mismos filtros de CU18',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'text/csv',
    'application/json',
    'application/xml',
  )
  @ApiResponse({ status: 200, description: 'Archivo generado' })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  async exportarReportePedidos(
    @Query() query: ReportePedidosExportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const archivo = await this.reportesService.exportarReportePedidos(query);
    return this.enviarArchivo(res, archivo);
  }

  @Get('entregas/export')
  @ApiOperation({
    summary:
      'Exporta el Reporte de Entregas (xlsx, pdf, csv, json o xml) con los mismos filtros de CU19',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'text/csv',
    'application/json',
    'application/xml',
  )
  @ApiResponse({ status: 200, description: 'Archivo generado' })
  @ApiResponse({
    status: 400,
    description:
      'Parametros de consulta invalidos, o el estado solicitado no corresponde a un estado final de entrega',
  })
  async exportarReporteEntregas(
    @Query() query: ReporteEntregasExportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const archivo = await this.reportesService.exportarReporteEntregas(query);
    return this.enviarArchivo(res, archivo);
  }

  @Get('motorizados/export')
  @ApiOperation({
    summary:
      'Exporta el Reporte de Productividad de Motorizados (xlsx, pdf, csv, json o xml) con los mismos filtros de CU20',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'text/csv',
    'application/json',
    'application/xml',
  )
  @ApiResponse({ status: 200, description: 'Archivo generado' })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  async exportarReporteMotorizados(
    @Query() query: ReporteMotorizadosExportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const archivo =
      await this.reportesService.exportarReporteMotorizados(query);
    return this.enviarArchivo(res, archivo);
  }

  /** Unico punto que fija los headers de descarga — reutilizado por los 3 endpoints de exportacion, ninguno repite esta logica. */
  private enviarArchivo(
    res: Response,
    archivo: { buffer: Buffer; nombreArchivo: string; mimeType: string },
  ): StreamableFile {
    res.set({
      'Content-Type': archivo.mimeType,
      'Content-Disposition': `attachment; filename="${archivo.nombreArchivo}"`,
    });
    return new StreamableFile(archivo.buffer);
  }
}
