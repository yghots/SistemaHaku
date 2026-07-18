import { BadRequestException } from '@nestjs/common';
import { esImagenWebp } from '../../common/utils/firma-archivo.util';

/**
 * Unico formato de imagen aceptado para fotografias de recojo/entrega
 * (Fase 22): las fotos se almacenan directamente en MySQL (`FotoEntrega.imagen`,
 * LONGBLOB), sin conversion de formato en el backend — el archivo recibido
 * debe llegar ya en este formato.
 */
export const FOTO_ENTREGA_MIME_PERMITIDO = 'image/webp';

/**
 * Limite maximo por fotografia (Fase 22), unica fuente de este valor —
 * nunca un numero magico repetido en un controller. Protege al backend de
 * cargas incorrectas; se aplica via `FileInterceptor`/`FilesInterceptor`
 * (`limits.fileSize`), igual que `LIMITE_ARCHIVO_BYTES` en Importaciones.
 */
export const FOTO_ENTREGA_TAMANIO_MAXIMO_BYTES = 5 * 1024 * 1024;

/**
 * Cantidad maxima de fotografias por solicitud de Confirmar Entrega (Fase
 * 29, correccion A9 de la auditoria) — antes no habia ningun tope, una
 * solicitud podia traer una cantidad ilimitada de archivos (cada uno hasta
 * `FOTO_ENTREGA_TAMANIO_MAXIMO_BYTES`), riesgo de agotamiento de memoria.
 * Unica fuente de este valor, aplicada via `FilesInterceptor` (segundo
 * parametro, `maxCount`).
 */
export const FOTO_ENTREGA_CANTIDAD_MAXIMA = 5;

/**
 * Validacion centralizada de una fotografia recibida por multipart/form-data
 * — unico punto que decide si un archivo es una foto de entrega valida.
 * Reutilizada por `FlujoPedidoController` (confirmar recojo/entrega); nunca
 * se repite esta logica en un controller.
 */
export function validarFotoEntrega(
  archivo: Express.Multer.File | undefined,
): Express.Multer.File {
  if (!archivo) {
    throw new BadRequestException('Debe adjuntar una fotografia');
  }
  if (archivo.mimetype !== FOTO_ENTREGA_MIME_PERMITIDO) {
    throw new BadRequestException(
      `Formato de imagen no soportado ('${archivo.mimetype}'). Unicamente se acepta '${FOTO_ENTREGA_MIME_PERMITIDO}'.`,
    );
  }
  // Fase 29 (correccion A8 de la auditoria): el mimetype anterior es el
  // Content-Type que el propio cliente declaro — trivialmente falsificable.
  // Se verifica ademas la firma binaria real del archivo (magic bytes).
  if (!esImagenWebp(archivo.buffer)) {
    throw new BadRequestException(
      'El archivo no es una imagen WEBP valida (firma binaria incorrecta).',
    );
  }
  return archivo;
}

/** Igual a `validarFotoEntrega`, para el arreglo de fotos de Confirmar Entrega (exige al menos una). */
export function validarFotosEntrega(
  archivos: Express.Multer.File[] | undefined,
): Express.Multer.File[] {
  if (!archivos || archivos.length === 0) {
    throw new BadRequestException('Debe adjuntar al menos una fotografia');
  }
  return archivos.map((archivo) => validarFotoEntrega(archivo));
}
