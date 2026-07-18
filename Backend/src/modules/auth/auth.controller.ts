import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Fase 29 (correccion A5 de la auditoria): unicos 2 endpoints del
  // proyecto con limite de solicitudes — `ThrottlerModule` se registra
  // exclusivamente en `AuthModule`, nunca como guard global, para no
  // afectar el resto de la API.
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ auth: {} })
  @ApiOperation({
    summary:
      'Autorregistro publico (siempre crea una cuenta con rol motorizado)',
  })
  @ApiResponse({
    status: 201,
    description: 'Cuenta creada',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 409, description: 'Usuario o correo ya en uso' })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas solicitudes — intenta nuevamente mas tarde',
  })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ auth: {} })
  @ApiOperation({ summary: 'Iniciar sesion con usuario o correo + contrasena' })
  @ApiResponse({
    status: 200,
    description: 'Autenticacion exitosa',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas' })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas solicitudes — intenta nuevamente mas tarde',
  })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }
}
