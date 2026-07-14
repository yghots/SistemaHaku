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
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => Promise.reject(normalizeError(error)),
);

function normalizeError(error: AxiosError<ApiErrorResponse>): HttpError {
  const body = error.response?.data;

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
