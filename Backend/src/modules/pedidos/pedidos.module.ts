import { Module } from '@nestjs/common';
import { ClientesModule } from '../clientes/clientes.module';
import { SucursalesModule } from '../sucursales/sucursales.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PEDIDOS_REPOSITORY } from './interfaces/pedidos-repository.interface';
import { PedidosController } from './pedidos.controller';
import { PedidosRepository } from './pedidos.repository';
import { PedidosService } from './pedidos.service';

@Module({
  imports: [SucursalesModule, ClientesModule, UsuariosModule],
  controllers: [PedidosController],
  providers: [
    PedidosService,
    { provide: PEDIDOS_REPOSITORY, useClass: PedidosRepository },
  ],
  exports: [PedidosService],
})
export class PedidosModule {}
