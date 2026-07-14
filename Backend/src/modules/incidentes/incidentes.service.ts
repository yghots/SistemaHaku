import { Inject, Injectable } from '@nestjs/common';
import { Incidente } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { assertFound } from '../../common/utils/assert-found.util';
import { PedidosService } from '../pedidos/pedidos.service';
import { PerfilesMotorizadosService } from '../perfiles-motorizados/perfiles-motorizados.service';
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { IncidenteResponseDto } from './dto/incidente-response.dto';
import { ListIncidentesQueryDto } from './dto/list-incidentes-query.dto';
import { INCIDENTES_REPOSITORY } from './interfaces/incidentes-repository.interface';
import type { IIncidentesRepository } from './interfaces/incidentes-repository.interface';
import { IncidentesMapper } from './incidentes.mapper';

@Injectable()
export class IncidentesService {
  constructor(
    @Inject(INCIDENTES_REPOSITORY)
    private readonly incidentesRepository: IIncidentesRepository,
    private readonly pedidosService: PedidosService,
    private readonly perfilesMotorizadosService: PerfilesMotorizadosService,
  ) {}

  async crear(dto: CreateIncidenteDto): Promise<IncidenteResponseDto> {
    if (dto.pedidoId !== undefined) {
      // Lanza NotFoundException si el pedido no existe.
      await this.pedidosService.buscarPorId(BigInt(dto.pedidoId));
    }
    // Lanza NotFoundException si el motorizado no existe.
    await this.perfilesMotorizadosService.buscarPorId(BigInt(dto.motorizadoId));

    const incidente = await this.incidentesRepository.crear({
      pedidoId: dto.pedidoId !== undefined ? BigInt(dto.pedidoId) : undefined,
      motorizadoId: BigInt(dto.motorizadoId),
      tipo: dto.tipo,
    });
    return IncidentesMapper.toResponseDto(incidente);
  }

  async buscarPorId(id: bigint): Promise<IncidenteResponseDto> {
    const incidente = await this.obtenerIncidenteOFallar(id);
    return IncidentesMapper.toResponseDto(incidente);
  }

  async listar(
    query: ListIncidentesQueryDto,
  ): Promise<PaginatedResponseDto<IncidenteResponseDto>> {
    const { data, total } = await this.incidentesRepository.buscarMuchos({
      skip: query.skip,
      take: query.limit,
      pedidoId: query.pedidoId ? BigInt(query.pedidoId) : undefined,
      motorizadoId: query.motorizadoId ? BigInt(query.motorizadoId) : undefined,
      tipo: query.tipo,
      resuelto: query.resuelto,
    });

    return new PaginatedResponseDto(
      IncidentesMapper.toResponseDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  private async obtenerIncidenteOFallar(id: bigint): Promise<Incidente> {
    const incidente = await this.incidentesRepository.buscarPorId(id);
    return assertFound(incidente, 'Incidente no encontrado');
  }
}
