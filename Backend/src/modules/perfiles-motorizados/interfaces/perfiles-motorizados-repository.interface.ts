import { PerfilMotorizado } from '@prisma/client';

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
}

export interface ActualizarPerfilMotorizadoData {
  placa?: string;
}

export interface BuscarPerfilesMotorizadosParams {
  skip: number;
  take: number;
  usuarioId?: bigint;
  placa?: string;
}

export interface IPerfilesMotorizadosRepository {
  crear(data: CrearPerfilMotorizadoData): Promise<PerfilMotorizadoConUsuario>;
  buscarPorId(id: bigint): Promise<PerfilMotorizadoConUsuario | null>;
  buscarPorUsuarioId(
    usuarioId: bigint,
  ): Promise<PerfilMotorizadoConUsuario | null>;
  buscarPorPlaca(placa: string): Promise<PerfilMotorizadoConUsuario | null>;
  buscarMuchos(
    params: BuscarPerfilesMotorizadosParams,
  ): Promise<{ data: PerfilMotorizadoConUsuario[]; total: number }>;
  actualizar(
    id: bigint,
    data: ActualizarPerfilMotorizadoData,
  ): Promise<PerfilMotorizadoConUsuario>;
  eliminar(id: bigint): Promise<PerfilMotorizadoConUsuario>;
  // Fase 32 (correccion N2 de la auditoria de certificacion): consulta
  // directa a la tabla `pedido` (mismo precedente ya establecido por
  // `UsuariosRepository.tienePerfilMotorizado`, Fase 29/A4 — evita inyectar
  // PedidosService, que crearia un ciclo de DI real ya que `pedidos` no
  // depende de `perfiles-motorizados` pero si lo hiciera se cerraria un
  // circulo con flujo-pedido).
  tienePedidosActivos(perfilId: bigint): Promise<boolean>;
}
