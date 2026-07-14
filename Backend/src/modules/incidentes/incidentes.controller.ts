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
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { IncidenteResponseDto } from './dto/incidente-response.dto';
import { ListIncidentesQueryDto } from './dto/list-incidentes-query.dto';
import { IncidentesService } from './incidentes.service';

// CRUD parcial a proposito (CU13): solo registrar, consultar y listar.
// No hay PATCH ni DELETE.
@ApiTags('Incidentes')
@Controller('incidentes')
export class IncidentesController {
  constructor(private readonly incidentesService: IncidentesService) {}

  @Post()
  @ApiOperation({
    summary:
      'Reportar un incidente (CU13): accidente, averia o dano al producto',
  })
  @ApiResponse({
    status: 201,
    description: 'Incidente registrado',
    type: IncidenteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({
    status: 404,
    description: 'Pedido o motorizado no encontrado',
  })
  crear(@Body() dto: CreateIncidenteDto): Promise<IncidenteResponseDto> {
    return this.incidentesService.crear(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Listar incidentes con paginacion y filtros por pedido, motorizado, tipo y resuelto',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de incidentes' })
  @ApiResponse({ status: 400, description: 'Parametros de consulta invalidos' })
  listar(
    @Query() query: ListIncidentesQueryDto,
  ): Promise<PaginatedResponseDto<IncidenteResponseDto>> {
    return this.incidentesService.listar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar un incidente por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Incidente encontrado',
    type: IncidenteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Id invalido' })
  @ApiResponse({ status: 404, description: 'Incidente no encontrado' })
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IncidenteResponseDto> {
    return this.incidentesService.buscarPorId(BigInt(id));
  }
}
