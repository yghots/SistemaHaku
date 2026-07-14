import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Nombre de usuario o correo electronico' })
  @IsString()
  @IsNotEmpty()
  identificador: string;

  @ApiProperty({ description: 'Contrasena' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
