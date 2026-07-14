import { Module } from '@nestjs/common';
import { CLIENTES_REPOSITORY } from './interfaces/clientes-repository.interface';
import { ClientesController } from './clientes.controller';
import { ClientesRepository } from './clientes.repository';
import { ClientesService } from './clientes.service';

@Module({
  controllers: [ClientesController],
  providers: [
    ClientesService,
    { provide: CLIENTES_REPOSITORY, useClass: ClientesRepository },
  ],
  exports: [ClientesService],
})
export class ClientesModule {}
