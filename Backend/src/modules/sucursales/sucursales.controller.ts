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
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { ListSucursalesQueryDto } from './dto/list-sucursales-query.dto';
import { SucursalResponseDto } from './dto/sucursal-response.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { SucursalesService } from './sucursales.service';

@ApiTags('Sucursales')
@Controller('sucursales')
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva sucursal para una tienda existente',
  })
  @ApiResponse({
    status: 201,
    description: 'Sucursal creada',
    type: SucursalResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada o eliminada' })
  crear(@Body() dto: CreateSucursalDto): Promise<SucursalResponseDto> {
    return this.sucursalesService.crear(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar sucursales con paginacion, filtro por tienda y busqueda por nombre',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de sucursales' })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  listar(
    @Query() query: ListSucursalesQueryDto,
  ): Promise<PaginatedResponseDto<SucursalResponseDto>> {
    return this.sucursalesService.listar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar una sucursal por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Sucursal encontrada',
    type: SucursalResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SucursalResponseDto> {
    return this.sucursalesService.buscarPorId(BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de una sucursal' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Sucursal actualizada',
    type: SucursalResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 404, description: 'Sucursal o tienda no encontrada' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSucursalDto,
  ): Promise<SucursalResponseDto> {
    return this.sucursalesService.actualizar(BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar logicamente una sucursal (deletedAt)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Sucursal eliminada logicamente',
    type: SucursalResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  eliminar(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SucursalResponseDto> {
    return this.sucursalesService.eliminar(BigInt(id));
  }
}
