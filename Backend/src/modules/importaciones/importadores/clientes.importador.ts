import { ConflictException, Injectable } from '@nestjs/common';
import { ClientesService } from '../../clientes/clientes.service';
import { CreateClienteDto } from '../../clientes/dto/create-cliente.dto';
import type {
  IEntidadImportador,
  ResultadoFilaImportador,
} from './resultado-fila.types';
import { validarFila } from './validar-fila.util';

/**
 * Importador de Clientes (Fase 19). Reutiliza `CreateClienteDto` tal cual
 * (misma validacion que `POST /clientes`) y `ClientesService.crear`/
 * `existeDocumentoDuplicado` (mismas reglas de negocio ya implementadas,
 * ninguna nueva). Vive fuera del modulo `clientes` — el Centro de
 * Importaciones es el unico punto de entrada de esta logica.
 *
 * Fase 26: la plantilla y el archivo de origen separan `nombres`/`apellidos`
 * (estandar de plantillas de personas) en vez de un unico `nombreCompleto` —
 * pero `CreateClienteDto` (y por lo tanto la columna real en la base de
 * datos) no cambia. Este importador concatena ambos campos en
 * `nombreCompleto` antes de validar, exactamente como si el archivo trajera
 * ese unico campo — el resto del proceso (validacion, deteccion de
 * duplicados, creacion) es identico a como era antes de esta fase.
 */
@Injectable()
export class ClientesImportador implements IEntidadImportador {
  readonly columnas = [
    'nombres',
    'apellidos',
    'telefono',
    'direccion',
    'documentoIdentidad',
  ];

  constructor(private readonly clientesService: ClientesService) {}

  async procesarFila(
    fila: Record<string, string>,
    dryRun: boolean,
  ): Promise<ResultadoFilaImportador> {
    const nombreCompleto = [fila.nombres, fila.apellidos]
      .filter(Boolean)
      .join(' ');
    const { dto, campo, motivo, valor } = await validarFila(CreateClienteDto, {
      nombreCompleto,
      telefono: fila.telefono,
      direccion: fila.direccion,
      documentoIdentidad: fila.documentoIdentidad || undefined,
    });
    if (!dto) {
      return { estado: 'invalido', motivo, campo, valor };
    }

    if (
      dto.documentoIdentidad &&
      (await this.clientesService.existeDocumentoDuplicado(
        dto.documentoIdentidad,
      ))
    ) {
      return {
        estado: 'duplicado',
        motivo: 'El documento de identidad ya esta en uso',
        campo: 'documentoIdentidad',
        valor: dto.documentoIdentidad,
      };
    }

    if (!dryRun) {
      try {
        await this.clientesService.crear(dto);
      } catch (error) {
        if (error instanceof ConflictException) {
          return {
            estado: 'duplicado',
            motivo: error.message,
            campo: 'documentoIdentidad',
            valor: dto.documentoIdentidad,
          };
        }
        throw error;
      }
    }

    return { estado: 'importado' };
  }
}
