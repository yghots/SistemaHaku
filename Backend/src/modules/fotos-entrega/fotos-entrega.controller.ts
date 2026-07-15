import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { FOTO_ENTREGA_MIME_PERMITIDO } from './foto-entrega.validator';
import { FotoEntregaResponseDto } from './dto/foto-entrega-response.dto';
import { FotosEntregaService } from './fotos-entrega.service';

// Solo lectura: las fotos unicamente pueden registrarse durante Confirmar
// Recojo o Confirmar Entrega (modulo flujo-pedido). No hay POST/PATCH/DELETE aqui.
@ApiTags('Fotos de Entrega')
@Controller('pedidos')
export class FotosEntregaController {
  constructor(private readonly fotosEntregaService: FotosEntregaService) {}

  @Get(':id/fotos')
  @ApiOperation({
    summary: 'Consultar las fotografias de recojo/entrega de un pedido',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Fotos paginadas del pedido' })
  @ApiResponse({
    status: 400,
    description: 'Id o parametros de consulta invalidos',
  })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  buscarPorPedido(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<FotoEntregaResponseDto>> {
    return this.fotosEntregaService.buscarPorPedido(BigInt(id), query);
  }

  @Get(':id/fotos/:fotoId/imagen')
  @ApiOperation({
    summary:
      'Sirve el binario de una fotografia (Fase 22): lectura directa desde MySQL, nunca desde disco',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'fotoId', type: Number })
  @ApiProduces(FOTO_ENTREGA_MIME_PERMITIDO)
  @ApiResponse({ status: 200, description: 'Binario de la imagen' })
  @ApiResponse({ status: 404, description: 'Pedido o foto no encontrada' })
  async obtenerImagen(
    @Param('id', ParseIntPipe) id: number,
    @Param('fotoId', ParseIntPipe) fotoId: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const foto = await this.fotosEntregaService.obtenerImagen(
      BigInt(id),
      BigInt(fotoId),
    );
    res.set({ 'Content-Type': foto.mimeType });
    return new StreamableFile(foto.imagen);
  }
}
