import { EstadoMotorizado, PerfilMotorizado } from '@prisma/client';

export const PERFILES_MOTORIZADOS_REPOSITORY = Symbol(
  'PERFILES_MOTORIZADOS_REPOSITORY',
);

export interface CrearPerfilMotorizadoData {
  usuarioId: bigint;
  placa: string;
  estado: EstadoMotorizado;
}

export interface ActualizarPerfilMotorizadoData {
  placa?: string;
  estado?: EstadoMotorizado;
}

export interface BuscarPerfilesMotorizadosParams {
  skip: number;
  take: number;
  usuarioId?: bigint;
  estado?: EstadoMotorizado;
  placa?: string;
}

export interface IPerfilesMotorizadosRepository {
  crear(data: CrearPerfilMotorizadoData): Promise<PerfilMotorizado>;
  buscarPorId(id: bigint): Promise<PerfilMotorizado | null>;
  buscarPorUsuarioId(usuarioId: bigint): Promise<PerfilMotorizado | null>;
  buscarMuchos(
    params: BuscarPerfilesMotorizadosParams,
  ): Promise<{ data: PerfilMotorizado[]; total: number }>;
  actualizar(
    id: bigint,
    data: ActualizarPerfilMotorizadoData,
  ): Promise<PerfilMotorizado>;
  eliminar(id: bigint): Promise<PerfilMotorizado>;
}
