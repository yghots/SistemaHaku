import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ReporteEntregasQueryDto } from './dto/reporte-entregas-query.dto';
import { ReporteMotorizadoItemDto } from './dto/reporte-motorizado-item.dto';
import { ReporteMotorizadosQueryDto } from './dto/reporte-motorizados-query.dto';
import { ReportePedidoItemDto } from './dto/reporte-pedido-item.dto';
import { ReportePedidosQueryDto } from './dto/reporte-pedidos-query.dto';
import {
  ESTADOS_REPORTE_ENTREGAS,
  REPORTES_REPOSITORY,
} from './interfaces/reportes-repository.interface';
import type { IReportesRepository } from './interfaces/reportes-repository.interface';
import { ReportesMapper } from './reportes.mapper';

@Injectable()
export class ReportesService {
  constructor(
    @Inject(REPORTES_REPOSITORY)
    private readonly reportesRepository: IReportesRepository,
  ) {}

  async reportePedidos(
    query: ReportePedidosQueryDto,
  ): Promise<PaginatedResponseDto<ReportePedidoItemDto>> {
    const { data, total } = await this.reportesRepository.reportePedidos({
      skip: query.skip,
      take: query.limit,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
      tiendaId: query.tiendaId ? BigInt(query.tiendaId) : undefined,
      estado: query.estado,
      motorizadoId: query.motorizadoId ? BigInt(query.motorizadoId) : undefined,
    });

    return new PaginatedResponseDto(
      ReportesMapper.toPedidoItemDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async reporteEntregas(
    query: ReporteEntregasQueryDto,
  ): Promise<PaginatedResponseDto<ReportePedidoItemDto>> {
    if (query.estado && !ESTADOS_REPORTE_ENTREGAS.includes(query.estado)) {
      throw new BadRequestException(
        `El estado debe ser uno de: ${ESTADOS_REPORTE_ENTREGAS.join(', ')}`,
      );
    }

    const { data, total } = await this.reportesRepository.reporteEntregas({
      skip: query.skip,
      take: query.limit,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
      estado: query.estado,
    });

    return new PaginatedResponseDto(
      ReportesMapper.toPedidoItemDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async reporteMotorizados(
    query: ReporteMotorizadosQueryDto,
  ): Promise<PaginatedResponseDto<ReporteMotorizadoItemDto>> {
    const { data, total } = await this.reportesRepository.reporteMotorizados({
      skip: query.skip,
      take: query.limit,
      motorizadoId: query.motorizadoId ? BigInt(query.motorizadoId) : undefined,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
    });

    return new PaginatedResponseDto(
      ReportesMapper.toMotorizadoItemDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }
}
