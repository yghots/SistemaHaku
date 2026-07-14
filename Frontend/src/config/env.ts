export interface AppEnv {
  apiBaseUrl: string;
  apiTimeoutMs: number;
  appName: string;
  /** Version del paquete frontend (package.json), mostrada en Mi Perfil (Fase 11). */
  appVersion: string;
}

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name] as string;
  if (!value) {
    throw new Error(`Variable de entorno faltante: ${name}`);
  }
  return value;
}

/** Unico punto de lectura de import.meta.env en todo el proyecto. */
export const env: AppEnv = {
  apiBaseUrl: required('VITE_API_BASE_URL'),
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000),
  appName: import.meta.env.VITE_APP_NAME || 'HAKU Courier',
  appVersion: '0.0.0',
};
