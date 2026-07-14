import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { RolUsuario } from '@prisma/client';
import { UsuariosMapper } from '../usuarios/usuarios.mapper';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const MENSAJE_CREDENCIALES_INVALIDAS = 'Credenciales invalidas';

@Injectable()
export class AuthService {
  constructor(private readonly usuariosService: UsuariosService) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const usuario = await this.usuariosService.crear({
      ...dto,
      rol: RolUsuario.motorizado,
    });
    return new AuthResponseDto(usuario);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const entidad = await this.usuariosService.buscarEntidadPorUsuarioOCorreo(
      dto.identificador,
    );

    // Se responde siempre con el mismo mensaje generico (401) para no
    // revelar si el problema fue usuario inexistente, inactivo, eliminado
    // o contrasena incorrecta (evita enumeracion de usuarios).
    if (!entidad || entidad.deletedAt !== null || !entidad.activo) {
      throw new UnauthorizedException(MENSAJE_CREDENCIALES_INVALIDAS);
    }

    const passwordValida = await argon2.verify(
      entidad.passwordHash,
      dto.password,
    );
    if (!passwordValida) {
      throw new UnauthorizedException(MENSAJE_CREDENCIALES_INVALIDAS);
    }

    return new AuthResponseDto(UsuariosMapper.toResponseDto(entidad));
  }
}
