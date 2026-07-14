import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ReporteEntregasQueryDto } from './dto/reporte-entregas-query.dto';
import { ReporteMotorizadoItemDto } from './dto/reporte-motorizado-item.dto';
import { ReporteMotorizadosQueryDto } from './dto/reporte-motorizados-query.dto';
import { ReportePedidoItemDto } from './dto/reporte-pedido-item.dto';
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
}
