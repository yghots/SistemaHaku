import { Inject, Injectable } from '@nestjs/common';
import { Sucursal } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { assertFound } from '../../common/utils/assert-found.util';
import { TiendasService } from '../tiendas/tiendas.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { ListSucursalesQueryDto } from './dto/list-sucursales-query.dto';
import { SucursalResponseDto } from './dto/sucursal-response.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { SUCURSALES_REPOSITORY } from './interfaces/sucursales-repository.interface';
import type { ISucursalesRepository } from './interfaces/sucursales-repository.interface';
import { SucursalesMapper } from './sucursales.mapper';

@Injectable()
export class SucursalesService {
  constructor(
    @Inject(SUCURSALES_REPOSITORY)
    private readonly sucursalesRepository: ISucursalesRepository,
    private readonly tiendasService: TiendasService,
  ) {}

  async crear(dto: CreateSucursalDto): Promise<SucursalResponseDto> {
    // Lanza NotFoundException si la tienda no existe o esta eliminada
    // logicamente (TiendasService.buscarPorId ya filtra deletedAt).
    await this.tiendasService.buscarPorId(BigInt(dto.tiendaId));

    const sucursal = await this.sucursalesRepository.crear({
      tiendaId: BigInt(dto.tiendaId),
      nombre: dto.nombre,
      direccion: dto.direccion,
      referencia: dto.referencia,
      telefono: dto.telefono,
      esPrincipal: dto.esPrincipal,
    });
    return SucursalesMapper.toResponseDto(sucursal);
  }

  async buscarPorId(id: bigint): Promise<SucursalResponseDto> {
    const sucursal = await this.obtenerSucursalOFallar(id);
    return SucursalesMapper.toResponseDto(sucursal);
  }

  async listar(
    query: ListSucursalesQueryDto,
  ): Promise<PaginatedResponseDto<SucursalResponseDto>> {
    const { data, total } = await this.sucursalesRepository.buscarMuchos({
      skip: query.skip,
      take: query.limit,
      tiendaId: query.tiendaId ? BigInt(query.tiendaId) : undefined,
      nombre: query.nombre,
    });

    return new PaginatedResponseDto(
      SucursalesMapper.toResponseDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async actualizar(
    id: bigint,
    dto: UpdateSucursalDto,
  ): Promise<SucursalResponseDto> {
    await this.obtenerSucursalOFallar(id);

    if (dto.tiendaId !== undefined) {
      // Valida que la nueva tienda tambien exista y no este eliminada.
      await this.tiendasService.buscarPorId(BigInt(dto.tiendaId));
    }

    const sucursalActualizada = await this.sucursalesRepository.actualizar(id, {
      ...(dto.tiendaId !== undefined ? { tiendaId: BigInt(dto.tiendaId) } : {}),
      ...(dto.nombre ? { nombre: dto.nombre } : {}),
      ...(dto.direccion ? { direccion: dto.direccion } : {}),
      ...(dto.referencia !== undefined ? { referencia: dto.referencia } : {}),
      ...(dto.telefono ? { telefono: dto.telefono } : {}),
      ...(dto.esPrincipal !== undefined
        ? { esPrincipal: dto.esPrincipal }
        : {}),
    });
    return SucursalesMapper.toResponseDto(sucursalActualizada);
  }

  async eliminar(id: bigint): Promise<SucursalResponseDto> {
    await this.obtenerSucursalOFallar(id);
    const sucursal = await this.sucursalesRepository.eliminarLogicamente(id);
    return SucursalesMapper.toResponseDto(sucursal);
  }

  private async obtenerSucursalOFallar(id: bigint): Promise<Sucursal> {
    const sucursal = await this.sucursalesRepository.buscarPorId(id);
    return assertFound(sucursal, 'Sucursal no encontrada');
  }
}
