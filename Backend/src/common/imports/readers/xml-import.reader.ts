import { BadRequestException, Injectable } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import type { FilaCruda, ILectorImportacion } from '../import.types';
import { stringificarValor } from '../stringificar-valor.util';

function normalizarRegistro(registro: unknown): FilaCruda {
  if (typeof registro !== 'object' || registro === null) return {};
  const resultado: FilaCruda = {};
  for (const [clave, valor] of Object.entries(
    registro as Record<string, unknown>,
  )) {
    resultado[clave] = stringificarValor(valor);
  }
  return resultado;
}

/** Misma jerarquia que produce el exportador de XML (Fase 18): `<importacion><registros><registro>...</registro></registros></importacion>`. */
function extraerRegistros(raiz: unknown): unknown[] {
  const importacion = (raiz as Record<string, unknown> | undefined)
    ?.importacion as Record<string, unknown> | undefined;
  const registros = (
    importacion?.registros as Record<string, unknown> | undefined
  )?.registro;

  if (registros === undefined) return [];
  return Array.isArray(registros) ? registros : [registros];
}

/**
 * Lector de xml: exige la estructura oficial de la plantilla
 * (`importacion > registros > registro*`). No conoce ninguna entidad —
 * solo produce `FilaCruda[]`.
 */
@Injectable()
export class XmlImportReader implements ILectorImportacion {
  leer(buffer: Buffer): FilaCruda[] {
    let raiz: unknown;
    try {
      raiz = create(buffer.toString('utf-8')).end({ format: 'object' });
    } catch {
      throw new BadRequestException(
        'El archivo XML no tiene un formato valido',
      );
    }

    return extraerRegistros(raiz).map(normalizarRegistro);
  }
}
