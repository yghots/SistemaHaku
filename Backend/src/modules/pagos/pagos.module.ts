import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PAGOS_REPOSITORY } from './interfaces/pagos-repository.interface';
import { PagosController } from './pagos.controller';
import { PagosRepository } from './pagos.repository';
import { PagosService } from './pagos.service';

@Module({
  imports: [PedidosModule, UsuariosModule],
  controllers: [PagosController],
  providers: [
    PagosService,
    { provide: PAGOS_REPOSITORY, useClass: PagosRepository },
  ],
  exports: [PagosService],
})
export class PagosModule {}
