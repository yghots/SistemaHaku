import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Tienda } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { assertFound } from '../../common/utils/assert-found.util';
import { isUniqueConstraintViolation } from '../../common/utils/prisma-error.util';
import { CreateTiendaDto } from './dto/create-tienda.dto';
import { ListTiendasQueryDto } from './dto/list-tiendas-query.dto';
import { TiendaResponseDto } from './dto/tienda-response.dto';
import { UpdateTiendaDto } from './dto/update-tienda.dto';
import { TIENDAS_REPOSITORY } from './interfaces/tiendas-repository.interface';
import type { ITiendasRepository } from './interfaces/tiendas-repository.interface';
import { TiendasMapper } from './tiendas.mapper';

@Injectable()
export class TiendasService {
  constructor(
    @Inject(TIENDAS_REPOSITORY)
    private readonly tiendasRepository: ITiendasRepository,
  ) {}

  async crear(dto: CreateTiendaDto): Promise<TiendaResponseDto> {
    await this.validarNombreDisponible(dto.nombre);
    if (dto.ruc) {
      await this.validarRucDisponible(dto.ruc);
    }

    try {
      const tienda = await this.tiendasRepository.crear({
        nombre: dto.nombre,
        ruc: dto.ruc,
      });
      return TiendasMapper.toResponseDto(tienda);
    } catch (error) {
      this.manejarErrorDeDuplicado(error);
    }
  }

  async buscarPorId(id: bigint): Promise<TiendaResponseDto> {
    const tienda = await this.obtenerTiendaOFallar(id);
    return TiendasMapper.toResponseDto(tienda);
  }

  async listar(
    query: ListTiendasQueryDto,
  ): Promise<PaginatedResponseDto<TiendaResponseDto>> {
    const { data, total } = await this.tiendasRepository.buscarMuchos({
      skip: query.skip,
      take: query.limit,
      nombre: query.nombre,
    });

    return new PaginatedResponseDto(
      TiendasMapper.toResponseDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async actualizar(
    id: bigint,
    dto: UpdateTiendaDto,
  ): Promise<TiendaResponseDto> {
    const tiendaActual = await this.obtenerTiendaOFallar(id);

    if (dto.nombre && dto.nombre !== tiendaActual.nombre) {
      await this.validarNombreDisponible(dto.nombre);
    }
    if (dto.ruc && dto.ruc !== tiendaActual.ruc) {
      await this.validarRucDisponible(dto.ruc);
    }

    try {
      const tiendaActualizada = await this.tiendasRepository.actualizar(id, {
        ...(dto.nombre ? { nombre: dto.nombre } : {}),
        ...(dto.ruc ? { ruc: dto.ruc } : {}),
      });
      return TiendasMapper.toResponseDto(tiendaActualizada);
    } catch (error) {
      this.manejarErrorDeDuplicado(error);
    }
  }

  async activar(id: bigint): Promise<TiendaResponseDto> {
    await this.obtenerTiendaOFallar(id);
    const tienda = await this.tiendasRepository.cambiarActivo(id, true);
    return TiendasMapper.toResponseDto(tienda);
  }

  async desactivar(id: bigint): Promise<TiendaResponseDto> {
    await this.obtenerTiendaOFallar(id);
    const tienda = await this.tiendasRepository.cambiarActivo(id, false);
    return TiendasMapper.toResponseDto(tienda);
  }

  async eliminar(id: bigint): Promise<TiendaResponseDto> {
    await this.obtenerTiendaOFallar(id);
    const tienda = await this.tiendasRepository.eliminarLogicamente(id);
    return TiendasMapper.toResponseDto(tienda);
  }

  private async obtenerTiendaOFallar(id: bigint): Promise<Tienda> {
    const tienda = await this.tiendasRepository.buscarPorId(id);
    return assertFound(tienda, 'Tienda no encontrada');
  }

  private async validarNombreDisponible(nombre: string): Promise<void> {
    const existente = await this.tiendasRepository.buscarPorNombre(nombre);
    if (existente) {
      throw new ConflictException('El nombre de la tienda ya esta en uso');
    }
  }

  private async validarRucDisponible(ruc: string): Promise<void> {
    const existente = await this.tiendasRepository.buscarPorRuc(ruc);
    if (existente) {
      throw new ConflictException('El RUC ya esta en uso');
    }
  }

  private manejarErrorDeDuplicado(error: unknown): never {
    if (isUniqueConstraintViolation(error)) {
      throw new ConflictException(
        'El nombre o RUC de la tienda ya esta en uso',
      );
    }
    throw error;
  }
}
