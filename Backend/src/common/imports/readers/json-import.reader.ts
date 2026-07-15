import { BadRequestException, Injectable } from '@nestjs/common';
import type { FilaCruda, ILectorImportacion } from '../import.types';
import { stringificarValor } from '../stringificar-valor.util';

function normalizarFila(fila: unknown): FilaCruda {
  if (typeof fila !== 'object' || fila === null) return {};
  const resultado: FilaCruda = {};
  for (const [clave, valor] of Object.entries(
    fila as Record<string, unknown>,
  )) {
    resultado[clave] = stringificarValor(valor);
  }
  return resultado;
}

/**
 * Lector de json: el archivo debe ser un arreglo de objetos (uno por
 * registro) — mismo formato que las plantillas oficiales. No conoce
 * ninguna entidad — solo produce `FilaCruda[]`.
 */
@Injectable()
export class JsonImportReader implements ILectorImportacion {
  leer(buffer: Buffer): FilaCruda[] {
    let datos: unknown;
    try {
      datos = JSON.parse(buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException(
        'El archivo JSON no tiene un formato valido',
      );
    }

    if (!Array.isArray(datos)) {
      throw new BadRequestException(
        'El archivo JSON debe contener un arreglo de registros',
      );
    }

    return datos.map(normalizarFila);
  }
}
