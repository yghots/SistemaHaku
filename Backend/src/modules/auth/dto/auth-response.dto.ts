import { ApiProperty } from '@nestjs/swagger';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario-response.dto';

// Estructura preparada para incorporar JWT en una fase posterior (por
// ejemplo agregando 'accessToken') sin modificar la logica de autenticacion.
export class AuthResponseDto {
  @ApiProperty({
    description: 'Datos basicos del usuario autenticado',
    type: UsuarioResponseDto,
  })
  usuario: UsuarioResponseDto;

  constructor(usuario: UsuarioResponseDto) {
    this.usuario = usuario;
  }
}
