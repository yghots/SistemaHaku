import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Forma de una fila de importacion de Motorizados — distinta de
 * `CreatePerfilMotorizadoDto` porque ese DTO exige un `usuarioId` numerico
 * (id interno), mientras que un archivo de importacion solo puede traer el
 * nombre de usuario (login) de una cuenta ya existente. Los mismos 2
 * campos (`usuario`, `placa`) y sus restricciones se copian 1:1 de
 * `CreateUsuarioDto.usuario` y `CreatePerfilMotorizadoDto` — ninguna regla
 * nueva, solo la forma de fila que el archivo puede expresar. (`estado`
 * eliminado en la Fase 33 junto con el resto del campo.)
 *
 * `PerfilesMotorizadosService.crear` ya exige un usuario existente (nunca
 * crea uno nuevo) — por eso la importacion de Motorizados NUNCA crea
 * cuentas de usuario, solo vincula un perfil a una cuenta ya registrada
 * (identificada por `usuario`). Evita el riesgo de manejar contrasenas en
 * texto plano dentro de un archivo de importacion.
 */
export class ImportarMotorizadoFilaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  usuario: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  placa: string;
}
