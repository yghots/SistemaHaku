import { PerfilMotorizadoResponseDto } from './dto/perfil-motorizado-response.dto';
import { PerfilMotorizadoConUsuario } from './interfaces/perfiles-motorizados-repository.interface';

export class PerfilesMotorizadosMapper {
  static toResponseDto(
    perfil: PerfilMotorizadoConUsuario,
  ): PerfilMotorizadoResponseDto {
    return new PerfilMotorizadoResponseDto({
      id: perfil.id.toString(),
      usuarioId: perfil.usuarioId.toString(),
      nombres: perfil.usuario.nombres,
      apellidos: perfil.usuario.apellidos,
      placa: perfil.placa,
    });
  }

  static toResponseDtoList(
    perfiles: PerfilMotorizadoConUsuario[],
  ): PerfilMotorizadoResponseDto[] {
    return perfiles.map((perfil) =>
      PerfilesMotorizadosMapper.toResponseDto(perfil),
    );
  }
}
