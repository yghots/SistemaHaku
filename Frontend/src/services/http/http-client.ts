import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../../config/env';
import type { ApiErrorResponse } from '../../types/api';
import { getAccessToken } from './auth-token';
import { HttpError } from './http-error';

/**
 * Cliente HTTP centralizado. Todo servicio que consuma la API del backend
 * debe importar esta instancia, nunca crear su propia instancia de axios.
 */
export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  // La instancia fija 'Content-Type: application/json' por defecto (arriba).
  // Cuando el body es un FormData (subida de archivos), ese header explicito
  // hace que axios serialice el FormData como JSON en vez de enviarlo como
  // multipart/form-data — hay que quitarlo para que el navegador genere el
  // Content-Type real con el boundary correcto.
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => Promise.reject(await normalizeError(error)),
);

/**
 * Cuando la solicitud se hizo con `responseType: 'blob'` (descargas de
 * exportacion, Fase 18), `error.response.data` llega como Blob en vez del
 * JSON ya parseado — axios no sabe de antemano que una respuesta de error
 * trae JSON aunque la exitosa sea binaria. Sin este paso, se perderia el
 * mensaje real del backend y solo quedaria el mensaje generico de axios.
 */
async function resolveErrorBody(
  error: AxiosError<ApiErrorResponse>,
): Promise<ApiErrorResponse | undefined> {
  const data = error.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()) as ApiErrorResponse;
    } catch {
      return undefined;
    }
  }
  return data;
}

async function normalizeError(error: AxiosError<ApiErrorResponse>): Promise<HttpError> {
  const body = await resolveErrorBody(error);

  if (body) {
    const details = Array.isArray(body.message) ? body.message : undefined;
    const message = details ? details.join(', ') : String(body.message ?? error.message);

    return new HttpError({
      statusCode: error.response?.status ?? 0,
      message,
      path: body.path,
      method: body.method,
      details,
    });
  }

  if (error.code === 'ECONNABORTED') {
    return new HttpError({
      statusCode: 0,
      message: 'La solicitud tardo demasiado en responder (timeout).',
    });
  }

  return new HttpError({
    statusCode: 0,
    message: 'No se pudo conectar con el servidor. Verifica tu conexion.',
  });
}
