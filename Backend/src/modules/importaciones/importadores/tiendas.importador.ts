import { ConflictException, Injectable } from '@nestjs/common';
import { CreateTiendaDto } from '../../tiendas/dto/create-tienda.dto';
import { TiendasService } from '../../tiendas/tiendas.service';
import type {
  IEntidadImportador,
  ResultadoFilaImportador,
} from './resultado-fila.types';
import { validarFila } from './validar-fila.util';

const MOTIVO_POR_CAMPO: Record<'nombre' | 'ruc', string> = {
  nombre: 'El nombre de la tienda ya esta en uso',
  ruc: 'El RUC ya esta en uso',
};

/**
 * Importador de Tiendas (Fase 19). Reutiliza `CreateTiendaDto` tal cual
 * (misma validacion que `POST /tiendas`) y `TiendasService.crear`/
 * `existeDuplicado` (mismas reglas de negocio ya implementadas, ninguna
 * nueva).
 */
@Injectable()
export class TiendasImportador implements IEntidadImportador {
  readonly columnas = ['nombre', 'ruc'];

  constructor(private readonly tiendasService: TiendasService) {}

  async procesarFila(
    fila: Record<string, string>,
    dryRun: boolean,
  ): Promise<ResultadoFilaImportador> {
    const { dto, campo, motivo, valor } = await validarFila(CreateTiendaDto, {
      nombre: fila.nombre,
      ruc: fila.ruc || undefined,
    });
    if (!dto) {
      return { estado: 'invalido', motivo, campo, valor };
    }

    const duplicado = await this.tiendasService.existeDuplicado(
      dto.nombre,
      dto.ruc,
    );
    if (duplicado) {
      return {
        estado: 'duplicado',
        motivo: MOTIVO_POR_CAMPO[duplicado.campo],
        campo: duplicado.campo,
        valor: duplicado.valor,
      };
    }

    if (!dryRun) {
      try {
        await this.tiendasService.crear(dto);
      } catch (error) {
        if (error instanceof ConflictException) {
          return {
            estado: 'duplicado',
            motivo: error.message,
            campo: 'nombre',
            valor: dto.nombre,
          };
        }
        throw error;
      }
    }

    return { estado: 'importado' };
  }
}
