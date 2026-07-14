import { PerfilMotorizado } from '@prisma/client';
import { PerfilMotorizadoResponseDto } from './dto/perfil-motorizado-response.dto';

export class PerfilesMotorizadosMapper {
  static toResponseDto(perfil: PerfilMotorizado): PerfilMotorizadoResponseDto {
    return new PerfilMotorizadoResponseDto({
      id: perfil.id.toString(),
      usuarioId: perfil.usuarioId.toString(),
      placa: perfil.placa,
      estado: perfil.estado,
    });
  }

  static toResponseDtoList(
    perfiles: PerfilMotorizado[],
  ): PerfilMotorizadoResponseDto[] {
    return perfiles.map((perfil) =>
      PerfilesMotorizadosMapper.toResponseDto(perfil),
    );
  }
}
