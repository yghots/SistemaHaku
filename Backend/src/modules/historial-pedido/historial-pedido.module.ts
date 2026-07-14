import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { HISTORIAL_PEDIDO_REPOSITORY } from './interfaces/historial-pedido-repository.interface';
import { HistorialPedidoController } from './historial-pedido.controller';
import { HistorialPedidoRepository } from './historial-pedido.repository';
import { HistorialPedidoService } from './historial-pedido.service';

@Module({
  imports: [PedidosModule],
  controllers: [HistorialPedidoController],
  providers: [
    HistorialPedidoService,
    {
      provide: HISTORIAL_PEDIDO_REPOSITORY,
      useClass: HistorialPedidoRepository,
    },
  ],
  exports: [HistorialPedidoService],
})
export class HistorialPedidoModule {}
