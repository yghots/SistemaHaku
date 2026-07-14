export interface HttpErrorParams {
  statusCode: number;
  message: string;
  path?: string;
  method?: string;
  /** Mensajes individuales cuando el backend devuelve un array (errores de ValidationPipe). */
  details?: string[];
}

/**
 * Error normalizado que expone el cliente HTTP a toda la app. Todo codigo
 * que llame a httpClient debe atrapar/propagar este tipo, nunca AxiosError
 * directamente.
 */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly path?: string;
  readonly method?: string;
  readonly details: string[];

  constructor(params: HttpErrorParams) {
    super(params.message);
    this.name = 'HttpError';
    this.statusCode = params.statusCode;
    this.path = params.path;
    this.method = params.method;
    this.details = params.details ?? [];
  }

  /** true para errores de red/timeout (sin respuesta del servidor). */
  get isNetworkError(): boolean {
    return this.statusCode === 0;
  }
}
