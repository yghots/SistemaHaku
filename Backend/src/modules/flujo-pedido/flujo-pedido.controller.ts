import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  FOTO_ENTREGA_CANTIDAD_MAXIMA,
  FOTO_ENTREGA_TAMANIO_MAXIMO_BYTES,
  validarFotoEntrega,
  validarFotosEntrega,
} from '../fotos-entrega/foto-entrega.validator';
import { PedidoResponseDto } from '../pedidos/dto/pedido-response.dto';
import { AsignarMotorizadoDto } from './dto/asignar-motorizado.dto';
import { CancelarPedidoDto } from './dto/cancelar-pedido.dto';
import { ConfirmarEntregaDto } from './dto/confirmar-entrega.dto';
import { ConfirmarRecojoDto } from './dto/confirmar-recojo.dto';
import { IniciarRutaDto } from './dto/iniciar-ruta.dto';
import { ReasignarMotorizadoDto } from './dto/reasignar-motorizado.dto';
import { RegistrarClienteAusenteDto } from './dto/registrar-cliente-ausente.dto';
import { RegistrarRechazoDto } from './dto/registrar-rechazo.dto';
import { FlujoPedidoService } from './flujo-pedido.service';

@ApiTags('Flujo de Pedido')
@Controller('pedidos')
export class FlujoPedidoController {
  constructor(private readonly flujoPedidoService: FlujoPedidoService) {}

  @Post(':id/confirmar-recojo')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Confirmar el recojo del pedido (CU08): registra la foto de recojo (multipart/form-data, campo "foto"), pasa a estado recogido y registra el historial',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Recojo confirmado',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos de entrada invalidos, foto faltante o formato de imagen no soportado',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido o motorizado no encontrado',
  })
  @ApiResponse({
    status: 409,
    description:
      'El motorizado no coincide con el asignado, o el pedido no esta en estado asignado',
  })
  @UseInterceptors(
    FileInterceptor('foto', {
      limits: { fileSize: FOTO_ENTREGA_TAMANIO_MAXIMO_BYTES },
    }),
  )
  confirmarRecojo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmarRecojoDto,
    @UploadedFile() foto: Express.Multer.File,
  ): Promise<PedidoResponseDto> {
    validarFotoEntrega(foto);
    return this.flujoPedidoService.confirmarRecojo(BigInt(id), dto, foto);
  }

  @Post(':id/iniciar-ruta')
  @ApiOperation({
    summary:
      'Iniciar la ruta del pedido (CU09): pasa a estado en_ruta y registra el historial (sin fotos)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Ruta iniciada',
    type: PedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Pedido o motorizado no encontrado',
  })
  @ApiResponse({
    status: 409,
    description:
      'El motorizado no coincide con el asignado, o el pedido no esta en estado recogido',
  })
  iniciarRuta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: IniciarRutaDto,
  ): Promise<PedidoResponseDto> {
    return this.flujoPedidoService.iniciarRuta(BigInt(id), dto);
  }

  @Post(':id/confirmar-entrega')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Confirmar la entrega del pedido (CU10): registra una o varias fotos de entrega (multipart/form-data, campo "fotos"), pasa a estado entregado y registra el historial',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Entrega confirmada',
    type: PedidoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos de entrada invalidos, ninguna foto adjunta, mas fotos que el maximo permitido, o formato de imagen no soportado',
  })
  @ApiResponse({
    status: 404,
    description: 'Pedido o motorizado no encontrado',
  })
  @ApiResponse({
    status: 409,
    description:
      'El motorizado no coincide con el asignado, o el pedido no esta en estado en_ruta',
  })
  @UseInterceptors(
    FilesInterceptor('fotos', FOTO_ENTREGA_CANTIDAD_MAXIMA, {
      limits: { fileSize: FOTO_ENTREGA_TAMANIO_MAXIMO_BYTES },
    }),
  )
  confirmarEntrega(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmarEntregaDto,
    @UploadedFiles() fotos: Express.Multer.File[],
  ): Promise<PedidoResponseDto> {
    validarFotosEntrega(fotos);
    return this.flujoPedidoService.confirmarEntrega(BigInt(id), dto, fotos);
  }

  @Post(':id/asignar-motorizado')
  @ApiOperation({
    summary:
      'Asignar motorizado al pedido (CU05): pasa a estado asignado y registra el historial',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Motorizado asignado',
    type: PedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Pedido, motorizado o usuario no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'El pedido no esta en estado pendiente',
  })
  asignarMotorizado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarMotorizadoDto,
  ): Promise<PedidoResponseDto> {
    return this.flujoPedidoService.asignarMotorizado(BigInt(id), dto);
  }

  @Post(':id/reasignar-motorizado')
  @ApiOperation({
    summary:
      'Reasignar motorizado al pedido (CU06): cambia el motorizado conservando el historial del cambio',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Motorizado reasignado',
    type: PedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Pedido, motorizado o usuario no encontrado',
  })
  @ApiResponse({
    status: 409,
    description:
      'El motorizado anterior no coincide con el motorizado actualmente asignado',
  })
  reasignarMotorizado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReasignarMotorizadoDto,
  ): Promise<PedidoResponseDto> {
    return this.flujoPedidoService.reasignarMotorizado(BigInt(id), dto);
  }

  @Post(':id/cliente-ausente')
  @ApiOperation({
    summary:
      'Registrar cliente ausente (CU11): pasa a estado cliente_ausente y registra el historial (sin fotos)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Cliente ausente registrado',
    type: PedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Pedido o motorizado no encontrado',
  })
  @ApiResponse({
    status: 409,
    description:
      'El motorizado no coincide con el asignado, o el pedido no esta en estado en_ruta',
  })
  registrarClienteAusente(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarClienteAusenteDto,
  ): Promise<PedidoResponseDto> {
    return this.flujoPedidoService.registrarClienteAusente(BigInt(id), dto);
  }

  @Post(':id/rechazo')
  @ApiOperation({
    summary:
      'Registrar rechazo del pedido (CU12): pasa a estado rechazado y registra el historial (sin fotos)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Rechazo registrado',
    type: PedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Pedido o motorizado no encontrado',
  })
  @ApiResponse({
    status: 409,
    description:
      'El motorizado no coincide con el asignado, o el pedido no esta en estado en_ruta',
  })
  registrarRechazo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarRechazoDto,
  ): Promise<PedidoResponseDto> {
    return this.flujoPedidoService.registrarRechazo(BigInt(id), dto);
  }

  @Post(':id/cancelar')
  @ApiOperation({
    summary:
      'Cancelar un pedido (CU04): pasa a estado cancelado y registra el historial. No usa el PATCH del CRUD de pedidos.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Pedido cancelado',
    type: PedidoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Pedido o usuario no encontrado',
  })
  @ApiResponse({
    status: 409,
    description:
      'El pedido no se puede cancelar en su estado actual (ya fue entregado o esta en un estado terminal)',
  })
  cancelarPedido(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelarPedidoDto,
  ): Promise<PedidoResponseDto> {
    return this.flujoPedidoService.cancelarPedido(BigInt(id), dto);
  }
}
