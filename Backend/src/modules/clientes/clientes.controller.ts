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
import { ClientesService } from './clientes.service';
import { ClienteResponseDto } from './dto/cliente-response.dto';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { ListClientesQueryDto } from './dto/list-clientes-query.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@ApiTags('Clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({
    status: 201,
    description: 'Cliente creado',
    type: ClienteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  crear(@Body() dto: CreateClienteDto): Promise<ClienteResponseDto> {
    return this.clientesService.crear(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar clientes con paginacion y busqueda opcional por nombre, telefono o documento',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de clientes' })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  listar(
    @Query() query: ListClientesQueryDto,
  ): Promise<PaginatedResponseDto<ClienteResponseDto>> {
    return this.clientesService.listar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar un cliente por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado',
    type: ClienteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ClienteResponseDto> {
    return this.clientesService.buscarPorId(BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un cliente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Cliente actualizado',
    type: ClienteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ): Promise<ClienteResponseDto> {
    return this.clientesService.actualizar(BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar logicamente un cliente (deletedAt)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Cliente eliminado logicamente',
    type: ClienteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<ClienteResponseDto> {
    return this.clientesService.eliminar(BigInt(id));
  }
}
