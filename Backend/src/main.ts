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
  const { port, apiPrefix, apiVersion, corsOrigin } =
    configService.getOrThrow<AppConfig>('app');

  app.use(helmet());
  app.use(compression());
  app.enableCors({ origin: corsOrigin, credentials: true });

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
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, swaggerDocument);

  await app.listen(port);
  Logger.log(
    `Aplicacion escuchando en http://localhost:${port}/${apiPrefix}/v${apiVersion}`,
    'Bootstrap',
  );
  Logger.log(
    `Documentacion Swagger en http://localhost:${port}/${apiPrefix}/docs`,
    'Bootstrap',
  );
}

void bootstrap();
