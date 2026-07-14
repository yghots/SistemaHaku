import { Injectable } from '@nestjs/common';
import {
  EstadoPedido,
  Pedido,
  Prisma,
  TipoEventoHistorial,
  TipoFoto,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AsignarMotorizadoData,
  CancelarPedidoData,
  ConfirmarEntregaData,
  ConfirmarRecojoData,
  IFlujoPedidoRepository,
  IniciarRutaData,
  ReasignarMotorizadoData,
  RegistrarClienteAusenteData,
  RegistrarRechazoData,
} from './interfaces/flujo-pedido-repository.interface';

interface EventoHistorialData {
  pedidoId: bigint;
  tipoEvento: TipoEventoHistorial;
  usuarioId: bigint;
  estado?: EstadoPedido;
  motorizadoId?: bigint;
}

@Injectable()
export class FlujoPedidoRepository implements IFlujoPedidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  confirmarRecojo(data: ConfirmarRecojoData): Promise<Pedido> {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.update({
        where: { id: data.pedidoId },
        data: { estado: EstadoPedido.recogido },
      });

      await tx.fotoEntrega.create({
        data: {
          pedidoId: data.pedidoId,
          motorizadoId: data.motorizadoId,
          tipo: TipoFoto.recojo,
          urlImagen: data.urlImagen,
          esPrincipal: true,
        },
      });

      await this.crearEventoHistorial(tx, {
        pedidoId: data.pedidoId,
        tipoEvento: TipoEventoHistorial.cambio_estado,
        estado: EstadoPedido.recogido,
        usuarioId: data.usuarioId,
      });

      return pedido;
    });
  }

  iniciarRuta(data: IniciarRutaData): Promise<Pedido> {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.update({
        where: { id: data.pedidoId },
        data: { estado: EstadoPedido.en_ruta },
      });

      await this.crearEventoHistorial(tx, {
        pedidoId: data.pedidoId,
        tipoEvento: TipoEventoHistorial.cambio_estado,
        estado: EstadoPedido.en_ruta,
        usuarioId: data.usuarioId,
      });

      return pedido;
    });
  }

  confirmarEntrega(data: ConfirmarEntregaData): Promise<Pedido> {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.update({
        where: { id: data.pedidoId },
        data: {
          estado: EstadoPedido.entregado,
          ...(data.observaciones !== undefined
            ? { observaciones: data.observaciones }
            : {}),
        },
      });

      if (data.fotos.length > 0) {
        await tx.fotoEntrega.createMany({
          data: data.fotos.map((foto) => ({
            pedidoId: data.pedidoId,
            motorizadoId: data.motorizadoId,
            tipo: TipoFoto.entrega,
            urlImagen: foto.urlImagen,
            esPrincipal: foto.esPrincipal ?? false,
          })),
        });
      }

      await this.crearEventoHistorial(tx, {
        pedidoId: data.pedidoId,
        tipoEvento: TipoEventoHistorial.cambio_estado,
        estado: EstadoPedido.entregado,
        usuarioId: data.usuarioId,
      });

      return pedido;
    });
  }

  asignarMotorizado(data: AsignarMotorizadoData): Promise<Pedido> {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.update({
        where: { id: data.pedidoId },
        data: {
          motorizadoActualId: data.motorizadoId,
          estado: EstadoPedido.asignado,
        },
      });

      await this.crearEventoHistorial(tx, {
        pedidoId: data.pedidoId,
        tipoEvento: TipoEventoHistorial.cambio_estado,
        estado: EstadoPedido.asignado,
        usuarioId: data.usuarioId,
      });

      return pedido;
    });
  }

  reasignarMotorizado(data: ReasignarMotorizadoData): Promise<Pedido> {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.update({
        where: { id: data.pedidoId },
        data: { motorizadoActualId: data.motorizadoNuevoId },
      });

      await this.crearEventoHistorial(tx, {
        pedidoId: data.pedidoId,
        tipoEvento: TipoEventoHistorial.reasignacion,
        motorizadoId: data.motorizadoNuevoId,
        usuarioId: data.usuarioId,
      });

      return pedido;
    });
  }

  registrarClienteAusente(data: RegistrarClienteAusenteData): Promise<Pedido> {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.update({
        where: { id: data.pedidoId },
        data: { estado: EstadoPedido.cliente_ausente },
      });

      await this.crearEventoHistorial(tx, {
        pedidoId: data.pedidoId,
        tipoEvento: TipoEventoHistorial.cambio_estado,
        estado: EstadoPedido.cliente_ausente,
        usuarioId: data.usuarioId,
      });

      return pedido;
    });
  }

  registrarRechazo(data: RegistrarRechazoData): Promise<Pedido> {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.update({
        where: { id: data.pedidoId },
        data: { estado: EstadoPedido.rechazado },
      });

      await this.crearEventoHistorial(tx, {
        pedidoId: data.pedidoId,
        tipoEvento: TipoEventoHistorial.cambio_estado,
        estado: EstadoPedido.rechazado,
        usuarioId: data.usuarioId,
      });

      return pedido;
    });
  }

  cancelarPedido(data: CancelarPedidoData): Promise<Pedido> {
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.update({
        where: { id: data.pedidoId },
        data: { estado: EstadoPedido.cancelado },
      });

      await this.crearEventoHistorial(tx, {
        pedidoId: data.pedidoId,
        tipoEvento: TipoEventoHistorial.cambio_estado,
        estado: EstadoPedido.cancelado,
        usuarioId: data.usuarioId,
      });

      return pedido;
    });
  }

  // Los 8 casos de uso de esta clase terminan con la misma escritura a
  // historial_pedido; centralizarla evita repetir el mismo bloque 8 veces.
  private async crearEventoHistorial(
    tx: Prisma.TransactionClient,
    data: EventoHistorialData,
  ): Promise<void> {
    await tx.historialPedido.create({ data });
  }
}
