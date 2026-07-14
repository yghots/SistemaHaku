import { Inject, Injectable } from '@nestjs/common';
import { Cliente } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { assertFound } from '../../common/utils/assert-found.util';
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
    const cliente = await this.clientesRepository.crear({
      nombreCompleto: dto.nombreCompleto,
      telefono: dto.telefono,
      direccion: dto.direccion,
      documentoIdentidad: dto.documentoIdentidad,
    });
    return ClientesMapper.toResponseDto(cliente);
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
    await this.obtenerClienteOFallar(id);

    const clienteActualizado = await this.clientesRepository.actualizar(id, {
      ...(dto.nombreCompleto ? { nombreCompleto: dto.nombreCompleto } : {}),
      ...(dto.telefono ? { telefono: dto.telefono } : {}),
      ...(dto.direccion ? { direccion: dto.direccion } : {}),
      ...(dto.documentoIdentidad !== undefined
        ? { documentoIdentidad: dto.documentoIdentidad }
        : {}),
    });
    return ClientesMapper.toResponseDto(clienteActualizado);
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
}
