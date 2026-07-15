import { Module } from '@nestjs/common';
import { ExportModule } from '../../common/exports/export.module';
import { ImportModule } from '../../common/imports/import.module';
import { ClientesModule } from '../clientes/clientes.module';
import { PerfilesMotorizadosModule } from '../perfiles-motorizados/perfiles-motorizados.module';
import { TiendasModule } from '../tiendas/tiendas.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ClientesImportador } from './importadores/clientes.importador';
import { MotorizadosImportador } from './importadores/motorizados.importador';
import { TiendasImportador } from './importadores/tiendas.importador';
import { ImportacionesController } from './importaciones.controller';
import { ImportacionesRepository } from './importaciones.repository';
import { ImportacionesService } from './importaciones.service';
import { IMPORTACIONES_REPOSITORY } from './interfaces/importaciones-repository.interface';

@Module({
  imports: [
    ImportModule,
    ExportModule,
    ClientesModule,
    TiendasModule,
    UsuariosModule,
    PerfilesMotorizadosModule,
  ],
  controllers: [ImportacionesController],
  providers: [
    ImportacionesService,
    ClientesImportador,
    TiendasImportador,
    MotorizadosImportador,
    { provide: IMPORTACIONES_REPOSITORY, useClass: ImportacionesRepository },
  ],
})
export class ImportacionesModule {}
