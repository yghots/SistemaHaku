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
import { AprobarSolicitudDto } from './dto/aprobar-solicitud.dto';
import { ListSolicitudesQueryDto } from './dto/list-solicitudes-query.dto';
import { RechazarSolicitudDto } from './dto/rechazar-solicitud.dto';
import { SolicitudPedidoResponseDto } from './dto/solicitud-pedido-response.dto';
import { SolicitudesPedidoService } from './solicitudes-pedido.service';

@ApiTags('Solicitudes de Pedido')
@Controller('solicitudes')
export class SolicitudesPedidoController {
  constructor(
    private readonly solicitudesPedidoService: SolicitudesPedidoService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Listar solicitudes de pedido con paginacion y filtros por estado, tienda, sucursal y rango de fechas',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de solicitudes',
  })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  listar(
    @Query() query: ListSolicitudesQueryDto,
  ): Promise<PaginatedResponseDto<SolicitudPedidoResponseDto>> {
    return this.solicitudesPedidoService.listar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar una solicitud de pedido por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Solicitud encontrada',
    type: SolicitudPedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SolicitudPedidoResponseDto> {
    return this.solicitudesPedidoService.buscarPorId(BigInt(id));
  }

  @Post(':id/aprobar')
  @ApiOperation({
    summary:
      'Aprobar una solicitud de pedido: crea o actualiza el Cliente por telefono y crea el Pedido (transaccion unica)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Solicitud aprobada y Pedido creado',
    type: SolicitudPedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Solicitud, usuario o sucursal no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'La solicitud no esta en estado pendiente',
  })
  aprobar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprobarSolicitudDto,
  ): Promise<SolicitudPedidoResponseDto> {
    return this.solicitudesPedidoService.aprobar(BigInt(id), dto);
  }

  @Post(':id/rechazar')
  @ApiOperation({ summary: 'Rechazar una solicitud de pedido, con motivo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Solicitud rechazada',
    type: SolicitudPedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  @ApiResponse({
    status: 409,
    description: 'La solicitud no esta en estado pendiente',
  })
  rechazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RechazarSolicitudDto,
  ): Promise<SolicitudPedidoResponseDto> {
    return this.solicitudesPedidoService.rechazar(BigInt(id), dto);
  }
}
