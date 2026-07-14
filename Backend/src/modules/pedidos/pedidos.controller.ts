import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { ListPedidosQueryDto } from './dto/list-pedidos-query.dto';
import { PedidoResponseDto } from './dto/pedido-response.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PedidosService } from './pedidos.service';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @ApiOperation({
    summary:
      'Registrar un nuevo pedido (estado inicial pendiente, sin motorizado asignado)',
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido registrado',
    type: PedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Sucursal, cliente o usuario creador no encontrado',
  })
  crear(@Body() dto: CreatePedidoDto): Promise<PedidoResponseDto> {
    return this.pedidosService.crear(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar pedidos con paginacion y filtros por codigo, cliente, sucursal, estado y rango de fechas',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de pedidos' })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  listar(
    @Query() query: ListPedidosQueryDto,
  ): Promise<PaginatedResponseDto<PedidoResponseDto>> {
    return this.pedidosService.listar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar un pedido por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pedido encontrado',
    type: PedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.buscarPorId(BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Actualizar datos del pedido (direccion, contacto, descripcion, valores, observaciones)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pedido actualizado',
    type: PedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePedidoDto,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.actualizar(BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un pedido (eliminacion fisica, segun el modelo)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Pedido eliminado',
    type: PedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El pedido tiene registros asociados',
  })
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<PedidoResponseDto> {
    return this.pedidosService.eliminar(BigInt(id));
  }
}
