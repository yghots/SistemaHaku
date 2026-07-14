import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { FOTOS_ENTREGA_REPOSITORY } from './interfaces/fotos-entrega-repository.interface';
import { FotosEntregaController } from './fotos-entrega.controller';
import { FotosEntregaRepository } from './fotos-entrega.repository';
import { FotosEntregaService } from './fotos-entrega.service';

@Module({
  imports: [PedidosModule],
  controllers: [FotosEntregaController],
  providers: [
    FotosEntregaService,
    { provide: FOTOS_ENTREGA_REPOSITORY, useClass: FotosEntregaRepository },
  ],
  exports: [FotosEntregaService],
})
export class FotosEntregaModule {}
