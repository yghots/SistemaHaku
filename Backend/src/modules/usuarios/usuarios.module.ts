import { Module } from '@nestjs/common';
import { USUARIOS_REPOSITORY } from './interfaces/usuarios-repository.interface';
import { UsuariosController } from './usuarios.controller';
import { UsuariosRepository } from './usuarios.repository';
import { UsuariosService } from './usuarios.service';

@Module({
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    { provide: USUARIOS_REPOSITORY, useClass: UsuariosRepository },
  ],
  exports: [UsuariosService],
})
export class UsuariosModule {}
