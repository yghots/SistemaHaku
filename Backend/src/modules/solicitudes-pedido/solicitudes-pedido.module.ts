import { Module } from '@nestjs/common';
import { SucursalesModule } from '../sucursales/sucursales.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { SOLICITUDES_PEDIDO_REPOSITORY } from './interfaces/solicitudes-pedido-repository.interface';
import { SolicitudesPedidoController } from './solicitudes-pedido.controller';
import { SolicitudesPedidoPublicController } from './solicitudes-pedido-public.controller';
import { SolicitudesPedidoRepository } from './solicitudes-pedido.repository';
import { SolicitudesPedidoService } from './solicitudes-pedido.service';

@Module({
  imports: [SucursalesModule, UsuariosModule],
  controllers: [SolicitudesPedidoController, SolicitudesPedidoPublicController],
  providers: [
    SolicitudesPedidoService,
    {
      provide: SOLICITUDES_PEDIDO_REPOSITORY,
      useClass: SolicitudesPedidoRepository,
    },
  ],
  exports: [SolicitudesPedidoService],
})
export class SolicitudesPedidoModule {}
