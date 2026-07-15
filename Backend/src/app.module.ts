import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { FlujoPedidoModule } from './modules/flujo-pedido/flujo-pedido.module';
import { FotosEntregaModule } from './modules/fotos-entrega/fotos-entrega.module';
import { HistorialPedidoModule } from './modules/historial-pedido/historial-pedido.module';
import { ImportacionesModule } from './modules/importaciones/importaciones.module';
import { IncidentesModule } from './modules/incidentes/incidentes.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { PerfilesMotorizadosModule } from './modules/perfiles-motorizados/perfiles-motorizados.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { SucursalesModule } from './modules/sucursales/sucursales.module';
import { TiendasModule } from './modules/tiendas/tiendas.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    PrismaModule,
    UsuariosModule,
    AuthModule,
    TiendasModule,
    SucursalesModule,
    ClientesModule,
    PerfilesMotorizadosModule,
    PedidosModule,
    HistorialPedidoModule,
    FotosEntregaModule,
    FlujoPedidoModule,
    IncidentesModule,
    ReportesModule,
    ImportacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
