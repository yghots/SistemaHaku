import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    // Fase 15 (correccion C2, ver AUDIT_REPORT.md): el mensaje de un error
    // NO controlado (`!isHttpException` — cualquier excepcion que no fue
    // lanzada deliberadamente por nuestro propio codigo, ej. errores de
    // Prisma, de conexion, o cualquier `throw` inesperado) nunca debe
    // llegar al cliente. Antes de esta correccion, como casi todo lo que
    // se lanza en JS/TS es una instancia de `Error`, `exception.message`
    // terminaba filtrando texto interno (nombres de columnas/restricciones
    // de Prisma, detalles de conexion) directo en la respuesta HTTP — en
    // contradiccion con lo documentado en ARCHITECTURE.md ("la respuesta
    // al cliente nunca incluye detalles internos"). Los mensajes de un
    // `HttpException` (400/401/403/404/409/422/etc.) siguen exactamente
    // igual que antes: son texto que nuestro propio codigo decidio
    // deliberadamente exponer.
    const message = isHttpException
      ? typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as { message?: string | string[] })?.message ??
          exception.message)
      : 'Error interno del servidor';

    if (!isHttpException) {
      this.logger.error(
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }
}
