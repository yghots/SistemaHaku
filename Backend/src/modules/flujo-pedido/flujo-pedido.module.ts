import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { PerfilesMotorizadosModule } from '../perfiles-motorizados/perfiles-motorizados.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { FlujoPedidoController } from './flujo-pedido.controller';
import { FlujoPedidoRepository } from './flujo-pedido.repository';
import { FlujoPedidoService } from './flujo-pedido.service';
import { FLUJO_PEDIDO_REPOSITORY } from './interfaces/flujo-pedido-repository.interface';

@Module({
  imports: [PedidosModule, PerfilesMotorizadosModule, UsuariosModule],
  controllers: [FlujoPedidoController],
  providers: [
    FlujoPedidoService,
    { provide: FLUJO_PEDIDO_REPOSITORY, useClass: FlujoPedidoRepository },
  ],
})
export class FlujoPedidoModule {}
