import { OmitType } from '@nestjs/swagger';
import { CreateUsuarioDto } from '../../usuarios/dto/create-usuario.dto';

// El registro publico siempre crea cuentas con rol 'motorizado' (CU15: "se
// autoregistran"). Crear cuentas de administrador queda reservado al CRUD
// de Usuarios, por eso 'rol' no forma parte de este DTO.
export class RegisterDto extends OmitType(CreateUsuarioDto, ['rol'] as const) {}
