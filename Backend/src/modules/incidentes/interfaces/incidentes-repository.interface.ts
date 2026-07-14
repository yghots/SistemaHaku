import { Incidente, TipoIncidente } from '@prisma/client';

export const INCIDENTES_REPOSITORY = Symbol('INCIDENTES_REPOSITORY');

export interface CrearIncidenteData {
  pedidoId?: bigint;
  motorizadoId: bigint;
  tipo: TipoIncidente;
}

export interface BuscarIncidentesParams {
  skip: number;
  take: number;
  pedidoId?: bigint;
  motorizadoId?: bigint;
  tipo?: TipoIncidente;
  resuelto?: boolean;
}

// CRUD parcial a proposito: solo crear, consultar y listar. No hay
// metodo de actualizacion ni de eliminacion (no solicitados esta fase).
export interface IIncidentesRepository {
  crear(data: CrearIncidenteData): Promise<Incidente>;
  buscarPorId(id: bigint): Promise<Incidente | null>;
  buscarMuchos(
    params: BuscarIncidentesParams,
  ): Promise<{ data: Incidente[]; total: number }>;
}
