import { Module } from '@nestjs/common';
import { PedidosModule } from '../pedidos/pedidos.module';
import { PerfilesMotorizadosModule } from '../perfiles-motorizados/perfiles-motorizados.module';
import { INCIDENTES_REPOSITORY } from './interfaces/incidentes-repository.interface';
import { IncidentesController } from './incidentes.controller';
import { IncidentesRepository } from './incidentes.repository';
import { IncidentesService } from './incidentes.service';

@Module({
  imports: [PedidosModule, PerfilesMotorizadosModule],
  controllers: [IncidentesController],
  providers: [
    IncidentesService,
    { provide: INCIDENTES_REPOSITORY, useClass: IncidentesRepository },
  ],
  exports: [IncidentesService],
})
export class IncidentesModule {}
