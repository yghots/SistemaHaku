import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { assertFound } from '../../common/utils/assert-found.util';
import {
  isForeignKeyViolation,
  isUniqueConstraintViolation,
} from '../../common/utils/prisma-error.util';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CreatePerfilMotorizadoDto } from './dto/create-perfil-motorizado.dto';
import { ListPerfilesMotorizadosQueryDto } from './dto/list-perfiles-motorizados-query.dto';
import { PerfilMotorizadoResponseDto } from './dto/perfil-motorizado-response.dto';
import { UpdatePerfilMotorizadoDto } from './dto/update-perfil-motorizado.dto';
import { PERFILES_MOTORIZADOS_REPOSITORY } from './interfaces/perfiles-motorizados-repository.interface';
import type {
  IPerfilesMotorizadosRepository,
  PerfilMotorizadoConUsuario,
} from './interfaces/perfiles-motorizados-repository.interface';
import { PerfilesMotorizadosMapper } from './perfiles-motorizados.mapper';

@Injectable()
export class PerfilesMotorizadosService {
  constructor(
    @Inject(PERFILES_MOTORIZADOS_REPOSITORY)
    private readonly perfilesMotorizadosRepository: IPerfilesMotorizadosRepository,
    private readonly usuariosService: UsuariosService,
  ) {}

  async crear(
    dto: CreatePerfilMotorizadoDto,
  ): Promise<PerfilMotorizadoResponseDto> {
    const usuarioId = BigInt(dto.usuarioId);

    // Lanza NotFoundException si el usuario no existe o esta eliminado
    // logicamente (UsuariosService.buscarPorId ya filtra deletedAt).
    const usuario = await this.usuariosService.buscarPorId(usuarioId);

    if (!usuario.activo) {
      throw new ConflictException('El usuario no esta activo');
    }
    if (usuario.rol !== RolUsuario.motorizado) {
      throw new ConflictException('El usuario no tiene rol motorizado');
    }

    const perfilExistente =
      await this.perfilesMotorizadosRepository.buscarPorUsuarioId(usuarioId);
    if (perfilExistente) {
      throw new ConflictException(
        'Ya existe un perfil de motorizado para este usuario',
      );
    }

    await this.validarPlacaDisponible(dto.placa);

    try {
      const perfil = await this.perfilesMotorizadosRepository.crear({
        usuarioId,
        placa: dto.placa,
      });
      return PerfilesMotorizadosMapper.toResponseDto(perfil);
    } catch (error) {
      this.manejarErrorDeDuplicado(error);
    }
  }

  /**
   * Deteccion de duplicados reutilizada por el Centro de Importaciones
   * (Fase 19) — nunca inventa una regla nueva: es la misma verificacion que
   * `crear`/`actualizar` ya hacen antes de escribir.
   */
  async existePlacaDuplicada(placa: string): Promise<boolean> {
    const existente =
      await this.perfilesMotorizadosRepository.buscarPorPlaca(placa);
    return existente !== null;
  }

  /** Misma verificacion que `crear` ya hace antes de escribir — expuesta para el chequeo de duplicados del Centro de Importaciones (Fase 19). */
  async existePerfilParaUsuario(usuarioId: bigint): Promise<boolean> {
    const existente =
      await this.perfilesMotorizadosRepository.buscarPorUsuarioId(usuarioId);
    return existente !== null;
  }

  async buscarPorId(id: bigint): Promise<PerfilMotorizadoResponseDto> {
    const perfil = await this.obtenerPerfilOFallar(id);
    return PerfilesMotorizadosMapper.toResponseDto(perfil);
  }

  async listar(
    query: ListPerfilesMotorizadosQueryDto,
  ): Promise<PaginatedResponseDto<PerfilMotorizadoResponseDto>> {
    const { data, total } =
      await this.perfilesMotorizadosRepository.buscarMuchos({
        skip: query.skip,
        take: query.limit,
        usuarioId: query.usuarioId ? BigInt(query.usuarioId) : undefined,
        placa: query.placa,
      });

    return new PaginatedResponseDto(
      PerfilesMotorizadosMapper.toResponseDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async actualizar(
    id: bigint,
    dto: UpdatePerfilMotorizadoDto,
  ): Promise<PerfilMotorizadoResponseDto> {
    const perfilActual = await this.obtenerPerfilOFallar(id);

    if (dto.placa && dto.placa !== perfilActual.placa) {
      await this.validarPlacaDisponible(dto.placa);
    }

    try {
      const perfilActualizado =
        await this.perfilesMotorizadosRepository.actualizar(id, {
          ...(dto.placa ? { placa: dto.placa } : {}),
        });
      return PerfilesMotorizadosMapper.toResponseDto(perfilActualizado);
    } catch (error) {
      this.manejarErrorDeDuplicado(error);
    }
  }

  async eliminar(id: bigint): Promise<PerfilMotorizadoResponseDto> {
    await this.obtenerPerfilOFallar(id);

    // Fase 32 (correccion N2 de la auditoria de certificacion): antes de
    // esta correccion, `Pedido.motorizadoActualId` usa `onDelete: SetNull`
    // (a diferencia de fotos/incidentes, que son `Restrict`), asi que
    // eliminar un perfil con un pedido activo asignado lo dejaba huerfano
    // (motorizadoActualId = NULL, estado sin cambiar) sin ninguna via de
    // recuperacion excepto cancelarlo. Se valida explicitamente en vez de
    // depender de la violacion de llave foranea, que nunca ocurriria para
    // esta relacion.
    if (await this.perfilesMotorizadosRepository.tienePedidosActivos(id)) {
      throw new ConflictException(
        'No se puede eliminar el perfil: tiene pedidos activos asignados',
      );
    }

    try {
      const perfil = await this.perfilesMotorizadosRepository.eliminar(id);
      return PerfilesMotorizadosMapper.toResponseDto(perfil);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException(
          'No se puede eliminar el perfil: tiene registros asociados (pedidos, fotos o incidentes)',
        );
      }
      throw error;
    }
  }

  private async obtenerPerfilOFallar(
    id: bigint,
  ): Promise<PerfilMotorizadoConUsuario> {
    const perfil = await this.perfilesMotorizadosRepository.buscarPorId(id);
    return assertFound(perfil, 'Perfil de motorizado no encontrado');
  }

  private async validarPlacaDisponible(placa: string): Promise<void> {
    if (await this.existePlacaDuplicada(placa)) {
      throw new ConflictException('La placa ya esta en uso');
    }
  }

  private manejarErrorDeDuplicado(error: unknown): never {
    if (isUniqueConstraintViolation(error)) {
      throw new ConflictException(
        'Ya existe un perfil de motorizado para este usuario, o la placa ya esta en uso',
      );
    }
    throw error;
  }
}
