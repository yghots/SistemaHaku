import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { HistorialPedidoResponseDto } from './dto/historial-pedido-response.dto';
import { HistorialPedidoService } from './historial-pedido.service';

// Solo lectura: el historial se genera unicamente desde los casos de uso
// de negocio (modulo flujo-pedido). No hay POST/PATCH/DELETE aqui.
@ApiTags('Historial de Pedidos')
@Controller('pedidos')
export class HistorialPedidoController {
  constructor(
    private readonly historialPedidoService: HistorialPedidoService,
  ) {}

  @Get(':id/historial')
  @ApiOperation({ summary: 'Consultar el historial de eventos de un pedido' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Historial paginado del pedido' })
  @ApiResponse({
    status: 400,
    description: 'Id o parametros de consulta invalidos',
  })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  buscarPorPedido(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<HistorialPedidoResponseDto>> {
    return this.historialPedidoService.buscarPorPedido(BigInt(id), query);
  }
}
