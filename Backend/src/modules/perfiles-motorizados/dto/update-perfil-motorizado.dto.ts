import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePerfilMotorizadoDto } from './create-perfil-motorizado.dto';

// usuarioId no es editable: el perfil queda ligado permanentemente al
// usuario con el que se creo (ver DEVELOPMENT_PROGRESS.md, Fase 6). Solo
// la placa se puede actualizar (Fase 33: `estado` eliminado del modelo).
export class UpdatePerfilMotorizadoDto extends PartialType(
  OmitType(CreatePerfilMotorizadoDto, ['usuarioId'] as const),
) {}
