import { env } from '../config/env';
import type { FotoEntrega } from '../types/foto-entrega';

/**
 * Unica funcion que construye la URL del binario de una foto ya guardada
 * (Fase 22): el backend almacena la imagen en MySQL y la sirve via
 * `GET /pedidos/:id/fotos/:fotoId/imagen` — nunca hay una `urlImagen`
 * propia en la entidad. No usa `httpClient` (es una URL para `<img src>`,
 * no una llamada de servicio) pero reutiliza el mismo `env.apiBaseUrl`
 * para no hardcodear el host.
 */
export function fotoEntregaUrl(foto: FotoEntrega): string {
  return `${env.apiBaseUrl}/pedidos/${foto.pedidoId}/fotos/${foto.id}/imagen`;
}
