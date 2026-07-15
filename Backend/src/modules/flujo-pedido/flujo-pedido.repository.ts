import { ConflictException, Injectable } from '@nestjs/common';
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
  ESTADOS_CANCELABLES,
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
      const pedido = await this.actualizarPedidoCondicional(
        tx,
        data.pedidoId,
        { estado: EstadoPedido.asignado },
        { estado: EstadoPedido.recogido },
        'No se pudo confirmar el recojo: el pedido cambio de estado antes de completar la operacion',
      );

      await tx.fotoEntrega.create({
        data: {
          pedidoId: data.pedidoId,
          motorizadoId: data.motorizadoId,
          tipo: TipoFoto.recojo,
          imagen: data.imagen,
          mimeType: data.mimeType,
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
      const pedido = await this.actualizarPedidoCondicional(
        tx,
        data.pedidoId,
        { estado: EstadoPedido.recogido },
        { estado: EstadoPedido.en_ruta },
        'No se pudo iniciar la ruta: el pedido cambio de estado antes de completar la operacion',
      );

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
      const pedido = await this.actualizarPedidoCondicional(
        tx,
        data.pedidoId,
        { estado: EstadoPedido.en_ruta },
        {
          estado: EstadoPedido.entregado,
          ...(data.observaciones !== undefined
            ? { observaciones: data.observaciones }
            : {}),
        },
        'No se pudo confirmar la entrega: el pedido cambio de estado antes de completar la operacion',
      );

      if (data.fotos.length > 0) {
        await tx.fotoEntrega.createMany({
          data: data.fotos.map((foto) => ({
            pedidoId: data.pedidoId,
            motorizadoId: data.motorizadoId,
            tipo: TipoFoto.entrega,
            imagen: foto.imagen,
            mimeType: foto.mimeType,
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
      const pedido = await this.actualizarPedidoCondicional(
        tx,
        data.pedidoId,
        { estado: EstadoPedido.pendiente },
        {
          motorizadoActualId: data.motorizadoId,
          estado: EstadoPedido.asignado,
        },
        'No se pudo asignar el motorizado: el pedido cambio de estado antes de completar la operacion',
      );

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
      // A diferencia de las demas transiciones, reasignarMotorizado no
      // valida el estado del pedido (inconsistencia real ya documentada y
      // dejada abierta a proposito, ver AUDIT_REPORT.md/DEVELOPMENT_PROGRESS.md
      // Fase 11/12) — la condicion atomica preserva exactamente esa misma
      // semantica: solo exige que el motorizado actual siga siendo el
      // esperado, nunca un estado en particular.
      const pedido = await this.actualizarPedidoCondicional(
        tx,
        data.pedidoId,
        { motorizadoActualId: data.motorizadoAnteriorId },
        { motorizadoActualId: data.motorizadoNuevoId },
        'El motorizado anterior no coincide con el motorizado asignado al pedido',
      );

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
      const pedido = await this.actualizarPedidoCondicional(
        tx,
        data.pedidoId,
        { estado: EstadoPedido.en_ruta },
        { estado: EstadoPedido.cliente_ausente },
        'No se pudo registrar cliente ausente: el pedido cambio de estado antes de completar la operacion',
      );

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
      const pedido = await this.actualizarPedidoCondicional(
        tx,
        data.pedidoId,
        { estado: EstadoPedido.en_ruta },
        { estado: EstadoPedido.rechazado },
        'No se pudo registrar el rechazo: el pedido cambio de estado antes de completar la operacion',
      );

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
      const pedido = await this.actualizarPedidoCondicional(
        tx,
        data.pedidoId,
        { estado: { in: ESTADOS_CANCELABLES } },
        { estado: EstadoPedido.cancelado },
        'No se pudo cancelar el pedido: su estado cambio antes de completar la operacion',
      );

      await this.crearEventoHistorial(tx, {
        pedidoId: data.pedidoId,
        tipoEvento: TipoEventoHistorial.cambio_estado,
        estado: EstadoPedido.cancelado,
        usuarioId: data.usuarioId,
      });

      return pedido;
    });
  }

  /**
   * Nucleo de la correccion de la Fase 15 (condicion de carrera, ver
   * AUDIT_REPORT.md C1): actualiza el pedido con `updateMany` filtrando
   * simultaneamente por `id` y por la precondicion de negocio de cada
   * transicion (estado esperado, o motorizado actual esperado en el caso
   * de `reasignarMotorizado`). MySQL/InnoDB bloquea la fila coincidente y
   * reevalua el `WHERE` contra el valor ya comprometido — si otra
   * transaccion ya cambio esa precondicion, `count` es 0 aqui y se
   * responde 409 sin haber escrito nada (ni fotos ni historial), en vez
   * de la lectura-luego-escritura separada que permitia dos transiciones
   * validas simultaneas sobre el mismo pedido. No hace falta bloqueo
   * explicito (`SELECT ... FOR UPDATE`) ni una columna de version: el
   * propio `UPDATE ... WHERE` condicionado ya es atomico a nivel de fila.
   * Reutilizado por los 8 casos de uso de este repositorio — ninguno
   * repite esta logica.
   */
  private async actualizarPedidoCondicional(
    tx: Prisma.TransactionClient,
    pedidoId: bigint,
    precondicion: Prisma.PedidoWhereInput,
    // "Unchecked" (no "Checked"): necesario para poder escribir
    // `motorizadoActualId` como escalar plano — el tipo "checked" lo
    // excluye por respaldar una relacion (`motorizadoActual`), igual que
    // ya ocurria implicitamente con el `tx.pedido.update` anterior a esta
    // correccion.
    data: Prisma.PedidoUncheckedUpdateManyInput,
    mensajeConflicto: string,
  ): Promise<Pedido> {
    const { count } = await tx.pedido.updateMany({
      where: { id: pedidoId, ...precondicion },
      data,
    });

    if (count === 0) {
      throw new ConflictException(mensajeConflicto);
    }

    return tx.pedido.findUniqueOrThrow({ where: { id: pedidoId } });
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
