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
import { CreateTiendaDto } from './dto/create-tienda.dto';
import { ListTiendasQueryDto } from './dto/list-tiendas-query.dto';
import { TiendaResponseDto } from './dto/tienda-response.dto';
import { UpdateTiendaDto } from './dto/update-tienda.dto';
import { TiendasService } from './tiendas.service';

@ApiTags('Tiendas')
@Controller('tiendas')
export class TiendasController {
  constructor(private readonly tiendasService: TiendasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva tienda' })
  @ApiResponse({
    status: 201,
    description: 'Tienda creada',
    type: TiendaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 409, description: 'Nombre o RUC ya en uso' })
  crear(@Body() dto: CreateTiendaDto): Promise<TiendaResponseDto> {
    return this.tiendasService.crear(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar tiendas con paginacion y busqueda opcional por nombre',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de tiendas' })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  listar(
    @Query() query: ListTiendasQueryDto,
  ): Promise<PaginatedResponseDto<TiendaResponseDto>> {
    return this.tiendasService.listar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar una tienda por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Tienda encontrada',
    type: TiendaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TiendaResponseDto> {
    return this.tiendasService.buscarPorId(BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de una tienda' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Tienda actualizada',
    type: TiendaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  @ApiResponse({ status: 409, description: 'Nombre o RUC ya en uso' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTiendaDto,
  ): Promise<TiendaResponseDto> {
    return this.tiendasService.actualizar(BigInt(id), dto);
  }

  @Patch(':id/activar')
  @ApiOperation({ summary: 'Activar una tienda' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Tienda activada',
    type: TiendaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  activar(@Param('id', ParseIntPipe) id: number): Promise<TiendaResponseDto> {
    return this.tiendasService.activar(BigInt(id));
  }

  @Patch(':id/desactivar')
  @ApiOperation({ summary: 'Desactivar una tienda' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Tienda desactivada',
    type: TiendaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  desactivar(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TiendaResponseDto> {
    return this.tiendasService.desactivar(BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar logicamente una tienda (deletedAt)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Tienda eliminada logicamente',
    type: TiendaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<TiendaResponseDto> {
    return this.tiendasService.eliminar(BigInt(id));
  }
}
