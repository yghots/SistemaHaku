import { ConflictException, Injectable } from '@nestjs/common';
import { PerfilesMotorizadosService } from '../../perfiles-motorizados/perfiles-motorizados.service';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario-response.dto';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { ImportarMotorizadoFilaDto } from './dto/importar-motorizado-fila.dto';
import type {
  IEntidadImportador,
  ResultadoFilaImportador,
} from './resultado-fila.types';
import { validarFila } from './validar-fila.util';

/**
 * Importador de Motorizados (Fase 19). Vincula un perfil de motorizado a
 * una cuenta de Usuario YA EXISTENTE (identificada por `usuario`, el login)
 * — nunca crea una cuenta nueva, exactamente como ya exige
 * `PerfilesMotorizadosService.crear` (requiere `usuarioId`, nunca datos de
 * registro). `verificarSinEscribir` reproduce en modo lectura las mismas
 * verificaciones que `crear` hace antes de escribir (activo, rol, perfil
 * ya existente, placa duplicada) — necesario porque la vista previa
 * (`dryRun = true`) nunca puede llamar a `crear` (escribiria en la base de
 * datos); se ejecuta siempre, en ambos modos, para que "analizar" y
 * "confirmar" clasifiquen las filas de forma identica.
 */
@Injectable()
export class MotorizadosImportador implements IEntidadImportador {
  readonly columnas = ['usuario', 'placa'];

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly perfilesMotorizadosService: PerfilesMotorizadosService,
  ) {}

  async procesarFila(
    fila: Record<string, string>,
    dryRun: boolean,
  ): Promise<ResultadoFilaImportador> {
    const { dto, campo, motivo, valor } = await validarFila(
      ImportarMotorizadoFilaDto,
      {
        usuario: fila.usuario,
        placa: fila.placa,
      },
    );
    if (!dto) {
      return { estado: 'invalido', motivo, campo, valor };
    }

    const usuario = await this.usuariosService.buscarPorUsuario(dto.usuario);
    if (!usuario) {
      return {
        estado: 'invalido',
        motivo: 'Usuario no encontrado',
        campo: 'usuario',
        valor: dto.usuario,
      };
    }

    try {
      await this.verificarSinEscribir(usuario, dto);
      if (!dryRun) {
        await this.perfilesMotorizadosService.crear({
          usuarioId: Number(usuario.id),
          placa: dto.placa,
        });
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        return this.clasificarConflicto(error.message, dto);
      }
      throw error;
    }

    return { estado: 'importado' };
  }

  private async verificarSinEscribir(
    usuario: UsuarioResponseDto,
    dto: ImportarMotorizadoFilaDto,
  ): Promise<void> {
    if (!usuario.activo) {
      throw new ConflictException('El usuario no esta activo');
    }
    if (usuario.rol !== 'motorizado') {
      throw new ConflictException('El usuario no tiene rol motorizado');
    }
    if (
      await this.perfilesMotorizadosService.existePerfilParaUsuario(
        BigInt(usuario.id),
      )
    ) {
      throw new ConflictException(
        'Ya existe un perfil de motorizado para este usuario',
      );
    }
    if (await this.perfilesMotorizadosService.existePlacaDuplicada(dto.placa)) {
      throw new ConflictException('La placa ya esta en uso');
    }
  }

  private clasificarConflicto(
    mensaje: string,
    dto: ImportarMotorizadoFilaDto,
  ): ResultadoFilaImportador {
    if (mensaje.includes('activo') || mensaje.includes('rol motorizado')) {
      return {
        estado: 'invalido',
        motivo: mensaje,
        campo: 'usuario',
        valor: dto.usuario,
      };
    }
    if (mensaje.includes('placa')) {
      return {
        estado: 'duplicado',
        motivo: mensaje,
        campo: 'placa',
        valor: dto.placa,
      };
    }
    return {
      estado: 'duplicado',
      motivo: mensaje,
      campo: 'usuario',
      valor: dto.usuario,
    };
  }
}
