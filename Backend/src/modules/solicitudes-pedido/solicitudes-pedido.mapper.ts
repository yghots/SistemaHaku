import { SolicitudPedido } from '@prisma/client';
import { SolicitudPedidoResponseDto } from './dto/solicitud-pedido-response.dto';
import { SucursalPublicaDto } from './dto/sucursal-publica.dto';
import { TiendaPublicaDto } from './dto/tienda-publica.dto';
import { TiendaConSucursalesPublico } from './interfaces/solicitudes-pedido-repository.interface';

export class SolicitudesPedidoMapper {
  static toResponseDto(solicitud: SolicitudPedido): SolicitudPedidoResponseDto {
    return new SolicitudPedidoResponseDto({
      id: solicitud.id.toString(),
      sucursalId: solicitud.sucursalId.toString(),
      nombreCompleto: solicitud.nombreCompleto,
      telefono: solicitud.telefono,
      direccionEntrega: solicitud.direccionEntrega,
      descripcionProducto: solicitud.descripcionProducto,
      valorProducto: solicitud.valorProducto?.toString() ?? null,
      costoEnvio: solicitud.costoEnvio?.toString() ?? null,
      observaciones: solicitud.observaciones,
      estado: solicitud.estado,
      motivoRechazo: solicitud.motivoRechazo,
      clienteId: solicitud.clienteId?.toString() ?? null,
      pedidoId: solicitud.pedidoId?.toString() ?? null,
      creadoEn: solicitud.creadoEn,
      revisadoEn: solicitud.revisadoEn,
    });
  }

  static toResponseDtoList(
    solicitudes: SolicitudPedido[],
  ): SolicitudPedidoResponseDto[] {
    return solicitudes.map((solicitud) =>
      SolicitudesPedidoMapper.toResponseDto(solicitud),
    );
  }

  static toTiendaPublicaDto(
    tienda: TiendaConSucursalesPublico,
  ): TiendaPublicaDto {
    return new TiendaPublicaDto({
      id: tienda.id.toString(),
      nombre: tienda.nombre,
      sucursales: tienda.sucursales.map(
        (sucursal) =>
          new SucursalPublicaDto({
            id: sucursal.id.toString(),
            nombre: sucursal.nombre,
          }),
      ),
    });
  }

  static toTiendaPublicaDtoList(
    tiendas: TiendaConSucursalesPublico[],
  ): TiendaPublicaDto[] {
    return tiendas.map((tienda) =>
      SolicitudesPedidoMapper.toTiendaPublicaDto(tienda),
    );
  }
}
