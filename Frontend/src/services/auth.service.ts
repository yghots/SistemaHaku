import { httpClient } from './http/http-client';
import type { LoginResponse } from '../types/auth';

export interface LoginPayload {
  identificador: string;
  password: string;
}

/**
 * Unico punto de llamadas al modulo de auth del backend. Ninguna pagina
 * debe usar `httpClient`/axios directamente: siempre a traves de este
 * servicio (o del que corresponda al recurso).
 */
export const AuthService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await httpClient.post<LoginResponse>('/auth/login', payload);
    return data;
  },
};
