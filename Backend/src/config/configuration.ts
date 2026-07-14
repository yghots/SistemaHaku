export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  apiVersion: string;
  corsOrigin: string[];
  databaseUrl: string;
}

// CORS_ORIGIN es obligatoria (ver env.validation.ts) y admite una lista
// de origenes separados por coma, para poder declarar distintos
// frontends en desarrollo/produccion sin escribir ningun origen en el
// codigo (Fase 12, Correccion 2).
function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export default (): { app: AppConfig } => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    apiVersion: process.env.API_VERSION ?? '1',
    corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN ?? ''),
    databaseUrl: process.env.DATABASE_URL ?? '',
  },
});
