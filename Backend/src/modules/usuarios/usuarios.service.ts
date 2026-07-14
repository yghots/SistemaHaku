import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Usuario } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { assertFound } from '../../common/utils/assert-found.util';
import { isUniqueConstraintViolation } from '../../common/utils/prisma-error.util';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { ListUsuariosQueryDto } from './dto/list-usuarios-query.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuarioResponseDto } from './dto/usuario-response.dto';
import { USUARIOS_REPOSITORY } from './interfaces/usuarios-repository.interface';
import type { IUsuariosRepository } from './interfaces/usuarios-repository.interface';
import { UsuariosMapper } from './usuarios.mapper';

@Injectable()
export class UsuariosService {
  constructor(
    @Inject(USUARIOS_REPOSITORY)
    private readonly usuariosRepository: IUsuariosRepository,
  ) {}

  async crear(dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    await this.validarUsuarioDisponible(dto.usuario);
    await this.validarCorreoDisponible(dto.correo);

    const passwordHash = await argon2.hash(dto.password);

    try {
      const usuario = await this.usuariosRepository.crear({
        usuario: dto.usuario,
        correo: dto.correo,
        passwordHash,
        rol: dto.rol,
      });
      return UsuariosMapper.toResponseDto(usuario);
    } catch (error) {
      this.manejarErrorDeDuplicado(error);
    }
  }

  async buscarPorId(id: bigint): Promise<UsuarioResponseDto> {
    const usuario = await this.obtenerUsuarioOFallar(id);
    return UsuariosMapper.toResponseDto(usuario);
  }

  async listar(
    query: ListUsuariosQueryDto,
  ): Promise<PaginatedResponseDto<UsuarioResponseDto>> {
    const { data, total } = await this.usuariosRepository.buscarMuchos({
      skip: query.skip,
      take: query.limit,
      usuario: query.usuario,
      correo: query.correo,
    });

    return new PaginatedResponseDto(
      UsuariosMapper.toResponseDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async actualizar(
    id: bigint,
    dto: UpdateUsuarioDto,
  ): Promise<UsuarioResponseDto> {
    const usuarioActual = await this.obtenerUsuarioOFallar(id);

    if (dto.usuario && dto.usuario !== usuarioActual.usuario) {
      await this.validarUsuarioDisponible(dto.usuario);
    }
    if (dto.correo && dto.correo !== usuarioActual.correo) {
      await this.validarCorreoDisponible(dto.correo);
    }

    try {
      const usuarioActualizado = await this.usuariosRepository.actualizar(id, {
        ...(dto.usuario ? { usuario: dto.usuario } : {}),
        ...(dto.correo ? { correo: dto.correo } : {}),
        ...(dto.rol ? { rol: dto.rol } : {}),
        ...(dto.password
          ? { passwordHash: await argon2.hash(dto.password) }
          : {}),
      });
      return UsuariosMapper.toResponseDto(usuarioActualizado);
    } catch (error) {
      this.manejarErrorDeDuplicado(error);
    }
  }

  async activar(id: bigint): Promise<UsuarioResponseDto> {
    await this.obtenerUsuarioOFallar(id);
    const usuario = await this.usuariosRepository.cambiarActivo(id, true);
    return UsuariosMapper.toResponseDto(usuario);
  }

  async desactivar(id: bigint): Promise<UsuarioResponseDto> {
    await this.obtenerUsuarioOFallar(id);
    const usuario = await this.usuariosRepository.cambiarActivo(id, false);
    return UsuariosMapper.toResponseDto(usuario);
  }

  async eliminar(id: bigint): Promise<UsuarioResponseDto> {
    await this.obtenerUsuarioOFallar(id);
    const usuario = await this.usuariosRepository.eliminarLogicamente(id);
    return UsuariosMapper.toResponseDto(usuario);
  }

  /**
   * Devuelve la entidad completa (incluye passwordHash) para uso exclusivo
   * del modulo de autenticacion. Nunca debe exponerse via controller.
   */
  async buscarEntidadPorUsuarioOCorreo(
    identificador: string,
  ): Promise<Usuario | null> {
    return this.usuariosRepository.buscarPorUsuarioOCorreo(identificador);
  }

  private async obtenerUsuarioOFallar(id: bigint): Promise<Usuario> {
    const usuario = await this.usuariosRepository.buscarPorId(id);
    return assertFound(usuario, 'Usuario no encontrado');
  }

  private async validarUsuarioDisponible(usuario: string): Promise<void> {
    const existente = await this.usuariosRepository.buscarPorUsuario(usuario);
    if (existente) {
      throw new ConflictException('El nombre de usuario ya esta en uso');
    }
  }

  private async validarCorreoDisponible(correo: string): Promise<void> {
    const existente = await this.usuariosRepository.buscarPorCorreo(correo);
    if (existente) {
      throw new ConflictException('El correo ya esta en uso');
    }
  }

  private manejarErrorDeDuplicado(error: unknown): never {
    if (isUniqueConstraintViolation(error)) {
      throw new ConflictException('El usuario o correo ya esta en uso');
    }
    throw error;
  }
}
