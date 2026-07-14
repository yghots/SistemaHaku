import { Usuario } from '@prisma/client';

export const USUARIOS_REPOSITORY = Symbol('USUARIOS_REPOSITORY');

export interface CrearUsuarioData {
  nombres: string;
  apellidos: string;
  usuario: string;
  correo: string;
  passwordHash: string;
  rol: Usuario['rol'];
}

export interface ActualizarUsuarioData {
  nombres?: string;
  apellidos?: string;
  usuario?: string;
  correo?: string;
  passwordHash?: string;
  rol?: Usuario['rol'];
}

export interface BuscarUsuariosParams {
  skip: number;
  take: number;
  usuario?: string;
  correo?: string;
}

export interface IUsuariosRepository {
  crear(data: CrearUsuarioData): Promise<Usuario>;
  buscarPorId(id: bigint): Promise<Usuario | null>;
  buscarPorUsuario(usuario: string): Promise<Usuario | null>;
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
  buscarPorUsuarioOCorreo(identificador: string): Promise<Usuario | null>;
  buscarMuchos(
    params: BuscarUsuariosParams,
  ): Promise<{ data: Usuario[]; total: number }>;
  actualizar(id: bigint, data: ActualizarUsuarioData): Promise<Usuario>;
  cambiarActivo(id: bigint, activo: boolean): Promise<Usuario>;
  eliminarLogicamente(id: bigint): Promise<Usuario>;
}
