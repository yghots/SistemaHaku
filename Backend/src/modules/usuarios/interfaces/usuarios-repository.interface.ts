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
  rol?: Usuario['rol'];
  // Fase 33 (Parte 3 del rediseno de ciclo de vida): filtro opcional por
  // estado de actividad de la cuenta — sin filtro, se muestran tanto
  // activos como inactivos (comportamiento previo, preservado por
  // compatibilidad); el Frontend decide el valor por defecto en la UI.
  activo?: boolean;
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
  /**
   * Fase 29 (correccion A4 de la auditoria): consulta directa a la tabla
   * `perfiles_motorizados` (mismo patron ya usado por `ReportesRepository`
   * para leer tablas de otros modulos sin pasar por su service) — evita que
   * `UsuariosService` dependa de `PerfilesMotorizadosService`, lo que
   * introduciria un ciclo en el grafo de dependencias entre modulos
   * (`perfiles-motorizados` ya depende de `usuarios`, nunca al reves).
   */
  tienePerfilMotorizado(usuarioId: bigint): Promise<boolean>;
  /**
   * Fase 33 (Parte 1 del rediseno de ciclo de vida): true si el usuario
   * participo en al menos un proceso operativo del negocio (pedidos
   * creados, eventos de historial registrados, pagos registrados,
   * importaciones ejecutadas, o un perfil de motorizado asociado) — cubre
   * exactamente las 5 relaciones con `onDelete: Restrict` hacia `Usuario`
   * en el schema. Un usuario con historial nunca puede eliminarse, solo
   * desactivarse.
   */
  tieneHistorial(usuarioId: bigint): Promise<boolean>;
}
