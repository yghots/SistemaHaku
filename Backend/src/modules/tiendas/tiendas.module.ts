import { Module } from '@nestjs/common';
import { TIENDAS_REPOSITORY } from './interfaces/tiendas-repository.interface';
import { TiendasController } from './tiendas.controller';
import { TiendasRepository } from './tiendas.repository';
import { TiendasService } from './tiendas.service';

@Module({
  controllers: [TiendasController],
  providers: [
    TiendasService,
    { provide: TIENDAS_REPOSITORY, useClass: TiendasRepository },
  ],
  exports: [TiendasService],
})
export class TiendasModule {}
