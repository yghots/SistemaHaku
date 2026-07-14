import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { PERFILES_MOTORIZADOS_REPOSITORY } from './interfaces/perfiles-motorizados-repository.interface';
import { PerfilesMotorizadosController } from './perfiles-motorizados.controller';
import { PerfilesMotorizadosRepository } from './perfiles-motorizados.repository';
import { PerfilesMotorizadosService } from './perfiles-motorizados.service';

@Module({
  imports: [UsuariosModule],
  controllers: [PerfilesMotorizadosController],
  providers: [
    PerfilesMotorizadosService,
    {
      provide: PERFILES_MOTORIZADOS_REPOSITORY,
      useClass: PerfilesMotorizadosRepository,
    },
  ],
  exports: [PerfilesMotorizadosService],
})
export class PerfilesMotorizadosModule {}
