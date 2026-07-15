import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Cliente } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { assertFound } from '../../common/utils/assert-found.util';
import { isUniqueConstraintViolation } from '../../common/utils/prisma-error.util';
import { ClienteResponseDto } from './dto/cliente-response.dto';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { ListClientesQueryDto } from './dto/list-clientes-query.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { CLIENTES_REPOSITORY } from './interfaces/clientes-repository.interface';
import type { IClientesRepository } from './interfaces/clientes-repository.interface';
import { ClientesMapper } from './clientes.mapper';

@Injectable()
export class ClientesService {
  constructor(
    @Inject(CLIENTES_REPOSITORY)
    private readonly clientesRepository: IClientesRepository,
  ) {}

  async crear(dto: CreateClienteDto): Promise<ClienteResponseDto> {
    if (dto.documentoIdentidad) {
      await this.validarDocumentoDisponible(dto.documentoIdentidad);
    }

    try {
      const cliente = await this.clientesRepository.crear({
        nombreCompleto: dto.nombreCompleto,
        telefono: dto.telefono,
        direccion: dto.direccion,
        documentoIdentidad: dto.documentoIdentidad,
      });
      return ClientesMapper.toResponseDto(cliente);
    } catch (error) {
      this.manejarErrorDeDuplicado(error);
    }
  }

  /**
   * Deteccion de duplicados reutilizada por el Centro de Importaciones
   * (Fase 19) — nunca inventa una regla nueva: es la misma verificacion que
   * `crear`/`actualizar` ya hacen antes de escribir.
   */
  async existeDocumentoDuplicado(documentoIdentidad: string): Promise<boolean> {
    const existente =
      await this.clientesRepository.buscarPorDocumentoIdentidad(
        documentoIdentidad,
      );
    return existente !== null;
  }

  async buscarPorId(id: bigint): Promise<ClienteResponseDto> {
    const cliente = await this.obtenerClienteOFallar(id);
    return ClientesMapper.toResponseDto(cliente);
  }

  async listar(
    query: ListClientesQueryDto,
  ): Promise<PaginatedResponseDto<ClienteResponseDto>> {
    const { data, total } = await this.clientesRepository.buscarMuchos({
      skip: query.skip,
      take: query.limit,
      nombre: query.nombre,
      telefono: query.telefono,
      documentoIdentidad: query.documentoIdentidad,
    });

    return new PaginatedResponseDto(
      ClientesMapper.toResponseDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async actualizar(
    id: bigint,
    dto: UpdateClienteDto,
  ): Promise<ClienteResponseDto> {
    const clienteActual = await this.obtenerClienteOFallar(id);

    if (
      dto.documentoIdentidad &&
      dto.documentoIdentidad !== clienteActual.documentoIdentidad
    ) {
      await this.validarDocumentoDisponible(dto.documentoIdentidad);
    }

    try {
      const clienteActualizado = await this.clientesRepository.actualizar(id, {
        ...(dto.nombreCompleto ? { nombreCompleto: dto.nombreCompleto } : {}),
        ...(dto.telefono ? { telefono: dto.telefono } : {}),
        ...(dto.direccion ? { direccion: dto.direccion } : {}),
        ...(dto.documentoIdentidad !== undefined
          ? { documentoIdentidad: dto.documentoIdentidad }
          : {}),
      });
      return ClientesMapper.toResponseDto(clienteActualizado);
    } catch (error) {
      this.manejarErrorDeDuplicado(error);
    }
  }

  async eliminar(id: bigint): Promise<ClienteResponseDto> {
    await this.obtenerClienteOFallar(id);
    const cliente = await this.clientesRepository.eliminarLogicamente(id);
    return ClientesMapper.toResponseDto(cliente);
  }

  private async obtenerClienteOFallar(id: bigint): Promise<Cliente> {
    const cliente = await this.clientesRepository.buscarPorId(id);
    return assertFound(cliente, 'Cliente no encontrado');
  }

  private async validarDocumentoDisponible(
    documentoIdentidad: string,
  ): Promise<void> {
    if (await this.existeDocumentoDuplicado(documentoIdentidad)) {
      throw new ConflictException('El documento de identidad ya esta en uso');
    }
  }

  private manejarErrorDeDuplicado(error: unknown): never {
    if (isUniqueConstraintViolation(error)) {
      throw new ConflictException('El documento de identidad ya esta en uso');
    }
    throw error;
  }
}
