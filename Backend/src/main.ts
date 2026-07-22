// Fase 30 (correccion B3 de la auditoria): antes se cargaba unicamente de
// forma transitoria (via alguna dependencia del framework) — nunca fallo,
// pero una futura version de Nest/TypeScript podria dejar de arrastrarla
// implicitamente. Esta es la unica linea de este archivo relacionada con
// esta correccion; debe ser el primer import (antes de cualquier decorador
// de class-validator/Prisma/NestJS que dependa de metadata de reflexion).
import 'reflect-metadata';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const { port, apiPrefix, apiVersion, corsOrigin, nodeEnv } =
    configService.getOrThrow<AppConfig>('app');

  app.use(helmet());
  app.use(compression());
  // `exposedHeaders`: sin esto, el navegador oculta Content-Disposition a
  // JS aunque el header viaje en la respuesta — el frontend lo necesita
  // para nombrar el archivo descargado en los endpoints de exportacion
  // (Fase 18, ver Backend/src/common/exports).
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Fase 29 (correccion A6 de la auditoria): Swagger nunca se monta en
  // produccion — antes se exponia incondicionalmente, documentando toda la
  // superficie de la API (incluidos ejemplos de payloads) a cualquiera con
  // acceso de red, sin importar el entorno.
  const swaggerHabilitado = nodeEnv !== 'production';
  if (swaggerHabilitado) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HAKU Courier API')
      .setDescription('API del sistema de gestion y logistica de HAKU Courier')
      .setVersion(apiVersion)
      .addTag('Health')
      .addTag('Usuarios')
      .addTag('Auth')
      .addTag('Tiendas')
      .addTag('Sucursales')
      .addTag('Clientes')
      .addTag('Perfiles de Motorizados')
      .addTag('Pedidos')
      .addTag('Historial de Pedidos')
      .addTag('Fotos de Entrega')
      .addTag('Flujo de Pedido')
      .addTag('Incidentes')
      .addTag('Reportes')
      .addTag('Importaciones')
      .addTag('Pagos')
      .addTag('Solicitudes de Pedido')
      .addTag('Solicitudes de Pedido (Publico)')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, swaggerDocument);
  }

  await app.listen(port);
  Logger.log(
    `Aplicacion escuchando en http://localhost:${port}/${apiPrefix}/v${apiVersion}`,
    'Bootstrap',
  );
  if (swaggerHabilitado) {
    Logger.log(
      `Documentacion Swagger en http://localhost:${port}/${apiPrefix}/docs`,
      'Bootstrap',
    );
  }
}

void bootstrap();
