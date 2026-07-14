import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RolUsuario } from '@prisma/client';

export class CreateUsuarioDto {
  @ApiProperty({ description: 'Nombres de la persona', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ description: 'Apellidos de la persona', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidos: string;

  @ApiProperty({
    description: 'Nombre de usuario para iniciar sesion',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  usuario: string;

  @ApiProperty({ description: 'Correo electronico, unico', maxLength: 150 })
  @IsEmail()
  @MaxLength(150)
  correo: string;

  @ApiProperty({
    description: 'Contrasena en texto plano (se almacena unicamente su hash)',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ description: 'Rol del usuario', enum: RolUsuario })
  @IsEnum(RolUsuario)
  rol: RolUsuario;
}
