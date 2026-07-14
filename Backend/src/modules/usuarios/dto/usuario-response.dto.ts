import { ApiProperty } from '@nestjs/swagger';
import { RolUsuario } from '@prisma/client';

export class UsuarioResponseDto {
  @ApiProperty({ description: 'Identificador unico del usuario' })
  id: string;

  @ApiProperty({ description: 'Nombre de usuario para iniciar sesion' })
  usuario: string;

  @ApiProperty({ description: 'Correo electronico' })
  correo: string;

  @ApiProperty({ description: 'Rol del usuario', enum: RolUsuario })
  rol: RolUsuario;

  @ApiProperty({ description: 'Indica si la cuenta esta activa' })
  activo: boolean;

  constructor(partial: UsuarioResponseDto) {
    Object.assign(this, partial);
  }
}
