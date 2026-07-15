import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { EstadoPedido } from '@prisma/client';
import { PedidoResponseDto } from '../pedidos/dto/pedido-response.dto';
import { PedidosService } from '../pedidos/pedidos.service';
import { PerfilMotorizadoResponseDto } from '../perfiles-motorizados/dto/perfil-motorizado-response.dto';
import { PerfilesMotorizadosService } from '../perfiles-motorizados/perfiles-motorizados.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AsignarMotorizadoDto } from './dto/asignar-motorizado.dto';
import { CancelarPedidoDto } from './dto/cancelar-pedido.dto';
import { ConfirmarEntregaDto } from './dto/confirmar-entrega.dto';
import { ConfirmarRecojoDto } from './dto/confirmar-recojo.dto';
import { IniciarRutaDto } from './dto/iniciar-ruta.dto';
import { ReasignarMotorizadoDto } from './dto/reasignar-motorizado.dto';
import { RegistrarClienteAusenteDto } from './dto/registrar-cliente-ausente.dto';
import { RegistrarRechazoDto } from './dto/registrar-rechazo.dto';
import {
  ESTADOS_CANCELABLES,
  FLUJO_PEDIDO_REPOSITORY,
} from './interfaces/flujo-pedido-repository.interface';
import type { IFlujoPedidoRepository } from './interfaces/flujo-pedido-repository.interface';

@Injectable()
export class FlujoPedidoService {
  constructor(
    @Inject(FLUJO_PEDIDO_REPOSITORY)
    private readonly flujoPedidoRepository: IFlujoPedidoRepository,
    private readonly pedidosService: PedidosService,
    private readonly perfilesMotorizadosService: PerfilesMotorizadosService,
    private readonly usuariosService: UsuariosService,
  ) {}

  async confirmarRecojo(
    pedidoId: bigint,
    dto: ConfirmarRecojoDto,
    foto: Express.Multer.File,
  ): Promise<PedidoResponseDto> {
    const pedido = await this.pedidosService.buscarPorId(pedidoId);
    const motorizado = await this.perfilesMotorizadosService.buscarPorId(
      BigInt(dto.motorizadoId),
    );

    this.verificarMotorizadoAsignado(pedido, motorizado);
    this.verificarEstado(pedido, EstadoPedido.asignado, 'confirmar el recojo');

    const actualizado = await this.flujoPedidoRepository.confirmarRecojo({
      pedidoId,
      motorizadoId: BigInt(dto.motorizadoId),
      usuarioId: BigInt(motorizado.usuarioId),
      imagen: Uint8Array.from(foto.buffer),
      mimeType: foto.mimetype,
    });
    return this.pedidosService.buscarPorId(actualizado.id);
  }

  async iniciarRuta(
    pedidoId: bigint,
    dto: IniciarRutaDto,
  ): Promise<PedidoResponseDto> {
    const pedido = await this.pedidosService.buscarPorId(pedidoId);
    const motorizado = await this.perfilesMotorizadosService.buscarPorId(
      BigInt(dto.motorizadoId),
    );

    this.verificarMotorizadoAsignado(pedido, motorizado);
    this.verificarEstado(pedido, EstadoPedido.recogido, 'iniciar la ruta');

    const actualizado = await this.flujoPedidoRepository.iniciarRuta({
      pedidoId,
      usuarioId: BigInt(motorizado.usuarioId),
    });
    return this.pedidosService.buscarPorId(actualizado.id);
  }

  async confirmarEntrega(
    pedidoId: bigint,
    dto: ConfirmarEntregaDto,
    fotos: Express.Multer.File[],
  ): Promise<PedidoResponseDto> {
    const pedido = await this.pedidosService.buscarPorId(pedidoId);
    const motorizado = await this.perfilesMotorizadosService.buscarPorId(
      BigInt(dto.motorizadoId),
    );

    this.verificarMotorizadoAsignado(pedido, motorizado);
    this.verificarEstado(pedido, EstadoPedido.en_ruta, 'confirmar la entrega');

    const actualizado = await this.flujoPedidoRepository.confirmarEntrega({
      pedidoId,
      motorizadoId: BigInt(dto.motorizadoId),
      usuarioId: BigInt(motorizado.usuarioId),
      observaciones: dto.observaciones,
      fotos: fotos.map((foto, index) => ({
        imagen: Uint8Array.from(foto.buffer),
        mimeType: foto.mimetype,
        esPrincipal: index === dto.fotoPrincipalIndex,
      })),
    });
    return this.pedidosService.buscarPorId(actualizado.id);
  }

  async asignarMotorizado(
    pedidoId: bigint,
    dto: AsignarMotorizadoDto,
  ): Promise<PedidoResponseDto> {
    const pedido = await this.pedidosService.buscarPorId(pedidoId);
    const motorizado = await this.perfilesMotorizadosService.buscarPorId(
      BigInt(dto.motorizadoId),
    );
    await this.usuariosService.buscarPorId(BigInt(dto.usuarioId));

    this.verificarEstado(
      pedido,
      EstadoPedido.pendiente,
      'asignar un motorizado',
    );

    const actualizado = await this.flujoPedidoRepository.asignarMotorizado({
      pedidoId,
      motorizadoId: BigInt(motorizado.id),
      usuarioId: BigInt(dto.usuarioId),
    });
    return this.pedidosService.buscarPorId(actualizado.id);
  }

  async reasignarMotorizado(
    pedidoId: bigint,
    dto: ReasignarMotorizadoDto,
  ): Promise<PedidoResponseDto> {
    const pedido = await this.pedidosService.buscarPorId(pedidoId);

    if (
      !pedido.motorizadoActualId ||
      pedido.motorizadoActualId !== String(dto.motorizadoAnteriorId)
    ) {
      throw new ConflictException(
        'El motorizado anterior no coincide con el motorizado asignado al pedido',
      );
    }

    const motorizadoNuevo = await this.perfilesMotorizadosService.buscarPorId(
      BigInt(dto.motorizadoNuevoId),
    );
    await this.usuariosService.buscarPorId(BigInt(dto.usuarioId));

    const actualizado = await this.flujoPedidoRepository.reasignarMotorizado({
      pedidoId,
      motorizadoAnteriorId: BigInt(dto.motorizadoAnteriorId),
      motorizadoNuevoId: BigInt(motorizadoNuevo.id),
      usuarioId: BigInt(dto.usuarioId),
    });
    return this.pedidosService.buscarPorId(actualizado.id);
  }

  async registrarClienteAusente(
    pedidoId: bigint,
    dto: RegistrarClienteAusenteDto,
  ): Promise<PedidoResponseDto> {
    const pedido = await this.pedidosService.buscarPorId(pedidoId);
    const motorizado = await this.perfilesMotorizadosService.buscarPorId(
      BigInt(dto.motorizadoId),
    );

    this.verificarMotorizadoAsignado(pedido, motorizado);
    this.verificarEstado(
      pedido,
      EstadoPedido.en_ruta,
      'registrar cliente ausente',
    );

    const actualizado =
      await this.flujoPedidoRepository.registrarClienteAusente({
        pedidoId,
        usuarioId: BigInt(motorizado.usuarioId),
      });
    return this.pedidosService.buscarPorId(actualizado.id);
  }

  async registrarRechazo(
    pedidoId: bigint,
    dto: RegistrarRechazoDto,
  ): Promise<PedidoResponseDto> {
    const pedido = await this.pedidosService.buscarPorId(pedidoId);
    const motorizado = await this.perfilesMotorizadosService.buscarPorId(
      BigInt(dto.motorizadoId),
    );

    this.verificarMotorizadoAsignado(pedido, motorizado);
    this.verificarEstado(pedido, EstadoPedido.en_ruta, 'registrar el rechazo');

    const actualizado = await this.flujoPedidoRepository.registrarRechazo({
      pedidoId,
      usuarioId: BigInt(motorizado.usuarioId),
    });
    return this.pedidosService.buscarPorId(actualizado.id);
  }

  async cancelarPedido(
    pedidoId: bigint,
    dto: CancelarPedidoDto,
  ): Promise<PedidoResponseDto> {
    const pedido = await this.pedidosService.buscarPorId(pedidoId);
    await this.usuariosService.buscarPorId(BigInt(dto.usuarioId));

    if (!ESTADOS_CANCELABLES.includes(pedido.estado)) {
      throw new ConflictException(
        `El pedido no se puede cancelar en estado '${pedido.estado}'`,
      );
    }

    const actualizado = await this.flujoPedidoRepository.cancelarPedido({
      pedidoId,
      usuarioId: BigInt(dto.usuarioId),
    });
    return this.pedidosService.buscarPorId(actualizado.id);
  }

  private verificarMotorizadoAsignado(
    pedido: PedidoResponseDto,
    motorizado: PerfilMotorizadoResponseDto,
  ): void {
    if (!pedido.motorizadoActualId) {
      throw new ConflictException('El pedido no tiene un motorizado asignado');
    }
    if (pedido.motorizadoActualId !== motorizado.id) {
      throw new ConflictException(
        'El motorizado no coincide con el motorizado asignado al pedido',
      );
    }
  }

  private verificarEstado(
    pedido: PedidoResponseDto,
    estadoEsperado: EstadoPedido,
    accion: string,
  ): void {
    if (pedido.estado !== estadoEsperado) {
      throw new ConflictException(
        `El pedido debe estar en estado '${estadoEsperado}' para ${accion} (estado actual: '${pedido.estado}')`,
      );
    }
  }
}
