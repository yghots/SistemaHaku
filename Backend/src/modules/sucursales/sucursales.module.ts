import { Module } from '@nestjs/common';
import { TiendasModule } from '../tiendas/tiendas.module';
import { SUCURSALES_REPOSITORY } from './interfaces/sucursales-repository.interface';
import { SucursalesController } from './sucursales.controller';
import { SucursalesRepository } from './sucursales.repository';
import { SucursalesService } from './sucursales.service';

@Module({
  imports: [TiendasModule],
  controllers: [SucursalesController],
  providers: [
    SucursalesService,
    { provide: SUCURSALES_REPOSITORY, useClass: SucursalesRepository },
  ],
  exports: [SucursalesService],
})
export class SucursalesModule {}
