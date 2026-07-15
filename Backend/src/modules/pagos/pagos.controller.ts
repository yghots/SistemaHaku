import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CrearPagoDto } from './dto/crear-pago.dto';
import { PagoResponseDto } from './dto/pago-response.dto';
import { ResumenPagoPedidoDto } from './dto/resumen-pago-pedido.dto';
import { PagosService } from './pagos.service';

// Modulo de Pagos (Fase 20): sub-recurso de Pedido (cuelga de
// /pedidos/:id/pagos, igual que historial y fotos). Solo registrar +
// consultar — sin PATCH/DELETE a proposito: un pago es un registro
// historico permanente.
@ApiTags('Pagos')
@Controller('pedidos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post(':id/pagos')
  @ApiOperation({
    summary:
      'Registra un pago de un pedido (parcial o total, cualquier metodo)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, type: PagoResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Datos invalidos (monto, metodo o monto recibido)',
  })
  @ApiResponse({ status: 404, description: 'Pedido o usuario no encontrado' })
  registrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearPagoDto,
  ): Promise<PagoResponseDto> {
    return this.pagosService.registrar(BigInt(id), dto);
  }

  @Get(':id/pagos')
  @ApiOperation({
    summary: 'Lista los pagos registrados de un pedido (paginado)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Pagos paginados del pedido' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  listarPorPedido(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PagoResponseDto>> {
    return this.pagosService.listarPorPedido(BigInt(id), query);
  }

  @Get(':id/pagos/resumen')
  @ApiOperation({
    summary:
      'Resumen calculado: total del pedido, total pagado, saldo pendiente y estado de pago',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: ResumenPagoPedidoDto })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  obtenerResumen(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResumenPagoPedidoDto> {
    return this.pagosService.obtenerResumen(BigInt(id));
  }
}
