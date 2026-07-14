import { Usuario } from '@prisma/client';
import { UsuarioResponseDto } from './dto/usuario-response.dto';

export class UsuariosMapper {
  static toResponseDto(usuario: Usuario): UsuarioResponseDto {
    return new UsuarioResponseDto({
      id: usuario.id.toString(),
      usuario: usuario.usuario,
      correo: usuario.correo,
      rol: usuario.rol,
      activo: usuario.activo,
    });
  }

  static toResponseDtoList(usuarios: Usuario[]): UsuarioResponseDto[] {
    return usuarios.map((usuario) => UsuariosMapper.toResponseDto(usuario));
  }
}
