import { EstadoMotorizado, PerfilMotorizado } from '@prisma/client';

export const PERFILES_MOTORIZADOS_REPOSITORY = Symbol(
  'PERFILES_MOTORIZADOS_REPOSITORY',
);

// Fase 17: todo endpoint de este modulo devuelve el perfil junto con
// nombres/apellidos del Usuario asociado (join vía Prisma `include`,
// nunca una consulta N+1 aparte) — para que ningun consumidor del
// sistema tenga que identificar a un motorizado unicamente por su placa.
export type PerfilMotorizadoConUsuario = PerfilMotorizado & {
  usuario: { nombres: string; apellidos: string };
};

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
  crear(data: CrearPerfilMotorizadoData): Promise<PerfilMotorizadoConUsuario>;
  buscarPorId(id: bigint): Promise<PerfilMotorizadoConUsuario | null>;
  buscarPorUsuarioId(
    usuarioId: bigint,
  ): Promise<PerfilMotorizadoConUsuario | null>;
  buscarMuchos(
    params: BuscarPerfilesMotorizadosParams,
  ): Promise<{ data: PerfilMotorizadoConUsuario[]; total: number }>;
  actualizar(
    id: bigint,
    data: ActualizarPerfilMotorizadoData,
  ): Promise<PerfilMotorizadoConUsuario>;
  eliminar(id: bigint): Promise<PerfilMotorizadoConUsuario>;
}
