import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';
import { stringificarValor } from '../../../common/imports/stringificar-valor.util';

export interface ResultadoValidacionFila<T> {
  dto?: T;
  campo?: string;
  motivo?: string;
  valor?: string;
}

/**
 * Valida una fila cruda contra un DTO existente (`CreateClienteDto`,
 * `CreateTiendaDto`, etc.) reutilizando exactamente los mismos decoradores
 * de `class-validator` que ya usa el `ValidationPipe` global de la API —
 * misma logica de validacion sin importar el formato de origen del archivo
 * (xlsx/json/xml) ni que el punto de entrada sea HTTP o una importacion.
 */
export async function validarFila<T extends object>(
  cls: ClassConstructor<T>,
  plano: Record<string, unknown>,
): Promise<ResultadoValidacionFila<T>> {
  const instancia = plainToInstance(cls, plano, {
    enableImplicitConversion: true,
  });
  const errores = await validate(instancia as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errores.length === 0) {
    return { dto: instancia };
  }

  const primero = errores[0];
  const motivo = primero.constraints
    ? Object.values(primero.constraints)[0]
    : 'Valor invalido';
  const valorCrudo = plano[primero.property];

  return {
    campo: primero.property,
    motivo,
    valor:
      valorCrudo !== undefined && valorCrudo !== null
        ? stringificarValor(valorCrudo)
        : undefined,
  };
}
