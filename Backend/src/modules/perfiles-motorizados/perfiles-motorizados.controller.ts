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
import { CreatePerfilMotorizadoDto } from './dto/create-perfil-motorizado.dto';
import { ListPerfilesMotorizadosQueryDto } from './dto/list-perfiles-motorizados-query.dto';
import { PerfilMotorizadoResponseDto } from './dto/perfil-motorizado-response.dto';
import { UpdatePerfilMotorizadoDto } from './dto/update-perfil-motorizado.dto';
import { PerfilesMotorizadosService } from './perfiles-motorizados.service';

@ApiTags('Perfiles de Motorizados')
@Controller('perfiles-motorizados')
export class PerfilesMotorizadosController {
  constructor(
    private readonly perfilesMotorizadosService: PerfilesMotorizadosService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un perfil de motorizado para un usuario existente',
  })
  @ApiResponse({
    status: 201,
    description: 'Perfil creado',
    type: PerfilMotorizadoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado o eliminado',
  })
  @ApiResponse({
    status: 409,
    description: 'Usuario inactivo, sin rol motorizado, o ya tiene un perfil',
  })
  crear(
    @Body() dto: CreatePerfilMotorizadoDto,
  ): Promise<PerfilMotorizadoResponseDto> {
    return this.perfilesMotorizadosService.crear(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar perfiles con paginacion y filtros por usuario, estado o placa',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de perfiles' })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  listar(
    @Query() query: ListPerfilesMotorizadosQueryDto,
  ): Promise<PaginatedResponseDto<PerfilMotorizadoResponseDto>> {
    return this.perfilesMotorizadosService.listar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar un perfil de motorizado por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Perfil encontrado',
    type: PerfilMotorizadoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PerfilMotorizadoResponseDto> {
    return this.perfilesMotorizadosService.buscarPorId(BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar placa y/o estado de un perfil de motorizado',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado',
    type: PerfilMotorizadoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePerfilMotorizadoDto,
  ): Promise<PerfilMotorizadoResponseDto> {
    return this.perfilesMotorizadosService.actualizar(BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Eliminar un perfil de motorizado (eliminacion fisica, segun el modelo)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Perfil eliminado',
    type: PerfilMotorizadoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El perfil tiene registros asociados',
  })
  eliminar(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PerfilMotorizadoResponseDto> {
    return this.perfilesMotorizadosService.eliminar(BigInt(id));
  }
}
