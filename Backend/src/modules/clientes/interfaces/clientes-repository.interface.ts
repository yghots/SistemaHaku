import { Cliente } from '@prisma/client';

export const CLIENTES_REPOSITORY = Symbol('CLIENTES_REPOSITORY');

export interface CrearClienteData {
  nombreCompleto: string;
  telefono: string;
  direccion: string;
  documentoIdentidad?: string;
}

export interface ActualizarClienteData {
  nombreCompleto?: string;
  telefono?: string;
  direccion?: string;
  documentoIdentidad?: string;
}

export interface BuscarClientesParams {
  skip: number;
  take: number;
  nombre?: string;
  telefono?: string;
  documentoIdentidad?: string;
}

export interface IClientesRepository {
  crear(data: CrearClienteData): Promise<Cliente>;
  buscarPorId(id: bigint): Promise<Cliente | null>;
  buscarMuchos(
    params: BuscarClientesParams,
  ): Promise<{ data: Cliente[]; total: number }>;
  actualizar(id: bigint, data: ActualizarClienteData): Promise<Cliente>;
  eliminarLogicamente(id: bigint): Promise<Cliente>;
}
