import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// Fase 29 (correccion A5 de la auditoria): limite de solicitudes exclusivo
// de `/auth/login` y `/auth/register` (proteccion contra fuerza bruta y
// creacion masiva de cuentas). Unica fuente de estos 2 valores: el
// controller reutiliza este mismo nombre ('auth') vía @Throttle, nunca
// repite los numeros.
export const LIMITE_SOLICITUDES_AUTH = 5;
export const VENTANA_LIMITE_AUTH_MS = seconds(60);

@Module({
  imports: [
    UsuariosModule,
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: VENTANA_LIMITE_AUTH_MS,
        limit: LIMITE_SOLICITUDES_AUTH,
      },
    ]),
  ],
  controllers: [AuthController],
  // `ThrottlerGuard` es un provider normal de este modulo (NUNCA
  // `APP_GUARD` global) — el controller lo activa explicitamente solo en
  // login/register vía `@UseGuards(ThrottlerGuard)`; el resto de la API
  // nunca pasa por este guard.
  providers: [AuthService, ThrottlerGuard],
})
export class AuthModule {}
