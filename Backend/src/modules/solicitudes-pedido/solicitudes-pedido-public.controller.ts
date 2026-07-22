import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSolicitudPublicaDto } from './dto/create-solicitud-publica.dto';
import { SolicitudPedidoResponseDto } from './dto/solicitud-pedido-response.dto';
import { TiendaPublicaDto } from './dto/tienda-publica.dto';
import { SolicitudesPedidoService } from './solicitudes-pedido.service';

// Controlador separado del administrativo (mismo modulo) a proposito: reune
// exclusivamente la superficie sin autenticacion que un canal externo
// (WhatsApp, formulario web, integraciones via n8n) necesita para registrar
// una solicitud — nunca expone datos administrativos (ver DTOs publicos).
@ApiTags('Solicitudes de Pedido (Publico)')
@Controller('public')
export class SolicitudesPedidoPublicController {
  constructor(
    private readonly solicitudesPedidoService: SolicitudesPedidoService,
  ) {}

  @Get('tiendas')
  @ApiOperation({
    summary:
      'Catalogo publico de tiendas activas y sus sucursales activas (id/nombre unicamente), para el formulario externo de solicitudes',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de tiendas con sus sucursales',
    type: [TiendaPublicaDto],
  })
  listarTiendas(): Promise<TiendaPublicaDto[]> {
    return this.solicitudesPedidoService.listarCatalogoPublico();
  }

  @Post('solicitudes')
  @ApiOperation({
    summary:
      'Registrar una nueva solicitud de pedido (estado inicial pendiente) desde un canal externo',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud registrada',
    type: SolicitudPedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  crear(
    @Body() dto: CreateSolicitudPublicaDto,
  ): Promise<SolicitudPedidoResponseDto> {
    return this.solicitudesPedidoService.crearPublico(dto);
  }
}
