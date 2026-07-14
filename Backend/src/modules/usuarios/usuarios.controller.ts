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
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { ListUsuariosQueryDto } from './dto/list-usuarios-query.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuarioResponseDto } from './dto/usuario-response.dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado',
    type: UsuarioResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 409, description: 'Usuario o correo ya en uso' })
  crear(@Body() dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    return this.usuariosService.crear(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios con paginacion y filtros opcionales',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de usuarios' })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  listar(
    @Query() query: ListUsuariosQueryDto,
  ): Promise<PaginatedResponseDto<UsuarioResponseDto>> {
    return this.usuariosService.listar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar un usuario por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: UsuarioResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.buscarPorId(BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Actualizar datos de un usuario (la contrasena solo se modifica si se envia)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado',
    type: UsuarioResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Usuario o correo ya en uso' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.actualizar(BigInt(id), dto);
  }

  @Patch(':id/activar')
  @ApiOperation({ summary: 'Activar la cuenta de un usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Usuario activado',
    type: UsuarioResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  activar(@Param('id', ParseIntPipe) id: number): Promise<UsuarioResponseDto> {
    return this.usuariosService.activar(BigInt(id));
  }

  @Patch(':id/desactivar')
  @ApiOperation({ summary: 'Desactivar la cuenta de un usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Usuario desactivado',
    type: UsuarioResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  desactivar(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.desactivar(BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar logicamente un usuario (deletedAt)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado logicamente',
    type: UsuarioResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<UsuarioResponseDto> {
    return this.usuariosService.eliminar(BigInt(id));
  }
}
