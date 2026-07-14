import { Tienda } from '@prisma/client';

export const TIENDAS_REPOSITORY = Symbol('TIENDAS_REPOSITORY');

export interface CrearTiendaData {
  nombre: string;
  ruc?: string;
}

export interface ActualizarTiendaData {
  nombre?: string;
  ruc?: string;
}

export interface BuscarTiendasParams {
  skip: number;
  take: number;
  nombre?: string;
}

export interface ITiendasRepository {
  crear(data: CrearTiendaData): Promise<Tienda>;
  buscarPorId(id: bigint): Promise<Tienda | null>;
  buscarPorNombre(nombre: string): Promise<Tienda | null>;
  buscarPorRuc(ruc: string): Promise<Tienda | null>;
  buscarMuchos(
    params: BuscarTiendasParams,
  ): Promise<{ data: Tienda[]; total: number }>;
  actualizar(id: bigint, data: ActualizarTiendaData): Promise<Tienda>;
  cambiarActivo(id: bigint, activo: boolean): Promise<Tienda>;
  eliminarLogicamente(id: bigint): Promise<Tienda>;
}
