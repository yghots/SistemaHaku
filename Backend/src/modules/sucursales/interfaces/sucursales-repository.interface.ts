import { Sucursal } from '@prisma/client';

export const SUCURSALES_REPOSITORY = Symbol('SUCURSALES_REPOSITORY');

export interface CrearSucursalData {
  tiendaId: bigint;
  nombre: string;
  direccion: string;
  referencia?: string;
  telefono: string;
  esPrincipal?: boolean;
}

export interface ActualizarSucursalData {
  tiendaId?: bigint;
  nombre?: string;
  direccion?: string;
  referencia?: string;
  telefono?: string;
  esPrincipal?: boolean;
}

export interface BuscarSucursalesParams {
  skip: number;
  take: number;
  tiendaId?: bigint;
  nombre?: string;
}

export interface ISucursalesRepository {
  crear(data: CrearSucursalData): Promise<Sucursal>;
  buscarPorId(id: bigint): Promise<Sucursal | null>;
  buscarMuchos(
    params: BuscarSucursalesParams,
  ): Promise<{ data: Sucursal[]; total: number }>;
  actualizar(id: bigint, data: ActualizarSucursalData): Promise<Sucursal>;
  eliminarLogicamente(id: bigint): Promise<Sucursal>;
}
