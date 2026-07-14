import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
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
}
